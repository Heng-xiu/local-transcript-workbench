import { AlertTriangle, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranscriptListItem } from "@/features/transcripts/types";
import { formatRelativeTime } from "@/lib/utils/time";
import { TranscriptStatusBadge } from "./TranscriptStatusBadge";

interface TranscriptFailedViewProps {
	transcript: TranscriptListItem;
	meetingTitle?: string;
}

/** Shown instead of the editor when transcription failed. Retry is a backend action. */
export function TranscriptFailedView({
	transcript,
	meetingTitle,
}: TranscriptFailedViewProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="flex max-w-md flex-col items-center gap-4">
				<AlertTriangle className="size-10 text-destructive" />
				<div className="flex flex-col items-center gap-2">
					<h2 className="text-lg font-semibold">{transcript.title}</h2>
					{meetingTitle ? (
						<span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
							<Video className="size-3.5" />
							{meetingTitle}
						</span>
					) : null}
					<TranscriptStatusBadge status={transcript.status} />
				</div>
				<p className="text-sm text-destructive">
					Transcription failed for this recording. The audio could not be
					processed into an editable transcript.
				</p>
				<p className="text-xs text-muted-foreground">
					Last attempt {formatRelativeTime(transcript.updatedAt)}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					title="Re-running transcription is a backend action (placeholder)."
				>
					<RotateCcw className="size-4" /> Retry transcription
				</Button>
			</div>
		</div>
	);
}
