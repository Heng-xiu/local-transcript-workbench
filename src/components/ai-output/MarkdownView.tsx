import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders generated Markdown with GitHub-flavoured extensions and prose styles. */
export function MarkdownView({
	markdown,
	className,
}: {
	markdown: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"prose prose-sm dark:prose-invert max-w-none",
				"prose-headings:font-semibold prose-pre:bg-muted prose-pre:text-foreground",
				className,
			)}
		>
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
		</div>
	);
}
