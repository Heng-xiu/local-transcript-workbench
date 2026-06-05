import { memo } from "react";
import type { TranscriptSegment } from "@/features/segments/types";
import type { Speaker } from "@/features/transcripts/types";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils/time";
import { SegmentEditor } from "./SegmentEditor";

interface TranscriptSegmentRowProps {
	segment: TranscriptSegment;
	speaker: Speaker | undefined;
	transcriptId: string;
	isActive: boolean;
	/** Seek audio to a time (seconds). */
	onSeek: (timeSec: number) => void;
}

function confidenceClass(confidence: number | undefined): string {
	if (confidence === undefined) return "text-muted-foreground/60";
	if (confidence >= 0.85) return "text-muted-foreground";
	if (confidence >= 0.7) return "text-amber-600 dark:text-amber-400";
	return "text-destructive";
}

function TranscriptSegmentRowImpl({
	segment,
	speaker,
	transcriptId,
	isActive,
	onSeek,
}: TranscriptSegmentRowProps) {
	const color = speaker?.color ?? "var(--muted-foreground)";
	return (
		<div
			data-active={isActive}
			className={cn(
				"flex gap-3 border-b border-l-2 border-l-transparent px-3 py-2.5 transition-colors",
				isActive && "border-l-primary bg-primary/5",
			)}
		>
			<div className="flex w-28 shrink-0 flex-col gap-1">
				<button
					type="button"
					onClick={() => onSeek(segment.startSec)}
					title="Jump audio to this point"
					className="w-fit rounded font-mono text-xs text-muted-foreground tabular-nums hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{formatClock(segment.startSec)}
				</button>
				<div className="flex items-center gap-1.5">
					<span
						className="size-2 shrink-0 rounded-full"
						style={{ backgroundColor: color }}
						aria-hidden
					/>
					<span className="truncate text-xs font-medium" title={speaker?.label}>
						{speaker?.label ?? "Speaker"}
					</span>
				</div>
				{segment.confidence !== undefined ? (
					<span
						className={cn(
							"text-[11px] tabular-nums",
							confidenceClass(segment.confidence),
						)}
						title="ASR confidence"
					>
						{Math.round(segment.confidence * 100)}%
					</span>
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				<SegmentEditor segment={segment} transcriptId={transcriptId} />
			</div>
		</div>
	);
}

export const TranscriptSegmentRow = memo(TranscriptSegmentRowImpl);
