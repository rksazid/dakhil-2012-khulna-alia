import prisma from "@/lib/prisma";
import { MemberDetailData } from "@/components/members/member-detail-modal";

export const forumAuthorSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  avatarUrl: true,
  thumbnailUrl: true,
  bannerUrl: true,
  bio: true,
  bloodGroup: true,
  studentGroup: true,
  classRoll: true,
  classroom: true,
  occupation: true,
  workplace: true,
  presentAddress: true,
  permanentAddress: true,
  role: true,
  userType: true,
  showPhoneInDirectory: true,
  showEmailInDirectory: true,
};

export interface ForumPostItem {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string | Date;
  parentId?: string | null;
  parent?: {
    id: string;
    author: {
      id: string;
      name: string;
      userType?: string | null;
    };
  } | null;
  author: MemberDetailData;
  replies: ForumPostItem[];
}

/**
 * Assembles a flat list of root posts and flat replies into a multi-layer recursive tree.
 * Supports arbitrary depth (replies to replies to replies...).
 */
export function buildForumThreadTree(
  rootPosts: any[],
  replies: any[]
): ForumPostItem[] {
  const postMap = new Map<string, ForumPostItem>();

  // 1. Initialize root posts
  const roots: ForumPostItem[] = rootPosts.map((post) => {
    const item: ForumPostItem = {
      id: post.id,
      content: post.content,
      isPinned: post.isPinned ?? false,
      createdAt: post.createdAt,
      parentId: null,
      parent: null,
      author: post.author,
      replies: [],
    };
    postMap.set(post.id, item);
    return item;
  });

  // 2. Initialize replies with empty child replies array
  replies.forEach((reply) => {
    const item: ForumPostItem = {
      id: reply.id,
      content: reply.content,
      isPinned: reply.isPinned ?? false,
      createdAt: reply.createdAt,
      parentId: reply.parentId,
      parent: reply.parent,
      author: reply.author,
      replies: [],
    };
    postMap.set(reply.id, item);
  });

  // 3. Attach each reply to its immediate parent
  replies.forEach((reply) => {
    const currentItem = postMap.get(reply.id);
    if (!currentItem) return;

    if (reply.parentId && postMap.has(reply.parentId)) {
      const parentItem = postMap.get(reply.parentId)!;
      parentItem.replies.push(currentItem);
    }
  });

  return roots;
}

/**
 * Fetches root forum posts along with all descendant threaded replies.
 */
export async function getForumFeed(): Promise<ForumPostItem[]> {
  const rootPosts = await prisma.forumPost.findMany({
    where: { parentId: null },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      author: { select: forumAuthorSelect },
    },
  });

  const replies = await prisma.forumPost.findMany({
    where: { parentId: { not: null } },
    orderBy: { createdAt: "asc" },
    take: 2000,
    include: {
      author: { select: forumAuthorSelect },
      parent: {
        select: {
          id: true,
          author: {
            select: {
              id: true,
              name: true,
              userType: true,
            },
          },
        },
      },
    },
  });

  return buildForumThreadTree(rootPosts, replies);
}

