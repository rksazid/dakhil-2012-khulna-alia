import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🧹 Clearing database for production deployment...");

  // Delete all operational and test records in proper dependency order
  const deletedLogs = await prisma.activityLog.deleteMany({});
  console.log(`- Deleted ${deletedLogs.count} activity logs`);

  const deletedExpenses = await prisma.fundExpense.deleteMany({});
  console.log(`- Deleted ${deletedExpenses.count} fund expenses`);

  const deletedContributions = await prisma.monthlyContribution.deleteMany({});
  console.log(`- Deleted ${deletedContributions.count} monthly contributions`);

  const deletedCommitments = await prisma.fundCommitment.deleteMany({});
  console.log(`- Deleted ${deletedCommitments.count} fund commitments`);

  const deletedManagers = await prisma.fundManager.deleteMany({});
  console.log(`- Deleted ${deletedManagers.count} fund manager assignments`);

  const deletedFunds = await prisma.fund.deleteMany({});
  console.log(`- Deleted ${deletedFunds.count} funds`);

  const deletedNotices = await prisma.notice.deleteMany({});
  console.log(`- Deleted ${deletedNotices.count} notices`);

  const deletedGallery = await prisma.galleryItem.deleteMany({});
  console.log(`- Deleted ${deletedGallery.count} gallery items`);

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`- Deleted ${deletedUsers.count} users`);

  // Ensure default site settings exist cleanly
  const defaultSettings = [
    {
      key: "hero_title",
      value: "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া",
      description: "Homepage Hero Title",
    },
    {
      key: "hero_subtitle",
      value: "একযুগের ভ্রাতৃত্ব, আত্মিক বন্ধন ও পারস্পরিক কল্যাণে অটুট ঐক্য। শতভাগ স্বচ্ছতা ও দায়িত্বশীলতায় পরিচালিত আমাদের কল্যাণ ফান্ড।",
      description: "Homepage Hero Subtitle",
    },
    {
      key: "marquee_notice",
      value: "📢 দাখিল ২০১২ ব্যাচের সকল বন্ধুদের প্রোফাইল হালনাগাদ এবং কল্যাণ ফান্ডের কার্যক্রমে অংশগ্রহণের আহ্বান জানানো হচ্ছে।",
      description: "Homepage Running Ticker Notice",
    },
    {
      key: "batch_motto",
      value: "বন্ধুত্বে প্রীতি, সেবায় ঐক্য — খুলনা আলিয়া ২০১২",
      description: "Batch Motto",
    },
    {
      key: "contact_email",
      value: "contact@dakhil2012.com",
      description: "Official Contact Email",
    },
    {
      key: "contact_phone",
      value: "+880 1700-000000",
      description: "Official Contact Phone",
    },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log(`- Reset and verified ${defaultSettings.length} default site settings`);

  console.log("\n✨ Database is now fresh, clean, and ready for production!");
  console.log("👉 The first user who registers through `/register` will automatically be granted SUPER_ADMIN privileges.\n");
}

clearDatabase()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

