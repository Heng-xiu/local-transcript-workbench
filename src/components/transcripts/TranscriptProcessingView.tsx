import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transcriptKeys } from "@/features/transcripts/queries";
import type { TranscriptListItem } from "@/features/transcripts/types";
import { formatRelativeTime } from "@/lib/utils/time";
import { TranscriptStatusBadge } from "./TranscriptStatusBadge";

interface TranscriptProcessingViewProps {
	transcript: TranscriptListItem;
	meetingTitle?: string;
}

/**
 * Shown instead of the editor when a transcript is still being generated. The
 * MVP hides fine-grained ASR pipeline states (extracting/diarizing/aligning) —
 * just a single "Processing" state with placeholder refresh/retry actions.
 */
export function TranscriptProcessingView({
	transcript,
	meetingTitle,
}: TranscriptProcessingViewProps) {
	const queryClient = useQueryClient();

	function refreshStatus() {
		void queryClient.invalidateQueries({ queryKey: transcriptKeys.list() });
	}

	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="flex max-w-md flex-col items-center gap-4">
				<Loader2 className="size-10 animate-spin text-muted-foreground" />
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
				<p className="text-sm text-muted-foreground">
					Transcript is being generated from the meeting recording. This view
					will become editable once it is ready.
				</p>
				<p className="text-xs text-muted-foreground">
					Updated {formatRelativeTime(transcript.updatedAt)}
				</p>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={refreshStatus}
					>
						<RefreshCw className="size-4" /> Refresh status
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						title="Re-running transcription is a backend action (placeholder)."
					>
						<RotateCcw className="size-4" /> Retry
					</Button>
				</div>
			</div>
		</div>
	);
}
