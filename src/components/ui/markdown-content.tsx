import { marked } from "marked";

interface MarkdownContentProps {
  content: string | null | undefined;
  className?: string;
}

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  let html = "";
  try {
    html = marked.parse(content) as string;
  } catch (err) {
    console.error("Markdown parse error:", err);
    html = `<p>${content}</p>`;
  }

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

