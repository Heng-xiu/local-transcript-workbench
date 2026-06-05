import { useLayoutEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { TranscriptSegment } from "@/features/segments/types";
import { useSegmentAutosave } from "@/features/segments/use-segment-autosave";
import { cn } from "@/lib/utils";
import { SaveStatusBadge } from "./SaveStatusBadge";

interface SegmentEditorProps {
	segment: TranscriptSegment;
	transcriptId: string;
}

function autosize(el: HTMLTextAreaElement): void {
	el.style.height = "auto";
	el.style.height = `${el.scrollHeight}px`;
}

/**
 * Editable segment text. Owns the autosave lifecycle (debounce/blur/unmount)
 * and renders the save-status badge. Typing only mutates a local draft; the API
 * is never hit per-keystroke. ⌘/Ctrl+Enter forces an immediate save.
 */
export function SegmentEditor({ segment, transcriptId }: SegmentEditorProps) {
	const { draft, status, onChange, onBlur, flush, retry } = useSegmentAutosave(
		segment,
		transcriptId,
	);
	const containerRef = useRef<HTMLDivElement>(null);

	// Auto-grow the textarea so the virtual list can measure variable heights.
	// `draft` is the intentional trigger: re-measure whenever the text changes
	// (including when an external/server edit is adopted).
	// biome-ignore lint/correctness/useExhaustiveDependencies: draft is a re-measure trigger
	useLayoutEffect(() => {
		const el = containerRef.current?.querySelector("textarea");
		if (el) autosize(el);
	}, [draft]);

	return (
		<div ref={containerRef}>
			<Textarea
				value={draft}
				onChange={(e) => {
					onChange(e.target.value);
					autosize(e.currentTarget);
				}}
				onBlur={onBlur}
				onKeyDown={(e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
						e.preventDefault();
						flush();
					}
				}}
				rows={1}
				aria-label={`Edit transcript text for segment ${segment.index + 1}`}
				className={cn(
					"min-h-0 resize-none overflow-hidden border-transparent bg-transparent px-2 py-1.5 text-sm leading-relaxed shadow-none",
					"hover:border-input focus-visible:border-input focus-visible:bg-background",
					status.state === "error" && "border-destructive/60",
				)}
			/>
			<div className="mt-1 flex h-4 items-center justify-end pr-1">
				<SaveStatusBadge status={status} onRetry={retry} />
			</div>
		</div>
	);
}
