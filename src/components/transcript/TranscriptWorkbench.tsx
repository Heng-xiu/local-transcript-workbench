import { AudioLines, FileText } from "lucide-react";
import { useEffect } from "react";
import { AudioPlayer } from "@/components/audio-player/AudioPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { useSegmentsQuery } from "@/features/segments/queries";
import { useTranscriptQuery } from "@/features/transcripts/queries";
import { playbackActions } from "@/lib/stores/playback-store";
import { segmentStatusActions } from "@/lib/stores/segment-status-store";
import { TranscriptVirtualList } from "./TranscriptVirtualList";

interface TranscriptWorkbenchProps {
	transcriptId: string | undefined;
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
			<FileText className="size-10 opacity-40" />
			<p className="text-sm">Select a project to open its transcript.</p>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="flex h-full flex-col">
			<div className="border-b px-4 py-3">
				<Skeleton className="h-9 w-full" />
			</div>
			<div className="flex flex-col gap-4 p-4">
				{SKELETON_ROWS.map((key) => (
					<div key={key} className="flex gap-3">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 flex-1" />
					</div>
				))}
			</div>
		</div>
	);
}

export function TranscriptWorkbench({
	transcriptId,
}: TranscriptWorkbenchProps) {
	const transcriptQuery = useTranscriptQuery(transcriptId);
	const segmentsQuery = useSegmentsQuery(transcriptId);
	const transcript = transcriptQuery.data;

	// Load the transcript's audio into the shared playback transport and clear
	// any save statuses left over from a previous transcript.
	useEffect(() => {
		if (!transcript) return;
		playbackActions.load(transcript.id, transcript.audio.durationSec);
		segmentStatusActions.reset();
		return () => {
			playbackActions.reset();
		};
	}, [transcript]);

	if (!transcriptId) return <EmptyState />;

	if (transcriptQuery.isError || segmentsQuery.isError) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center text-sm text-destructive">
				Failed to load transcript. Please try another project.
			</div>
		);
	}

	if (
		transcriptQuery.isPending ||
		segmentsQuery.isPending ||
		!transcript ||
		!segmentsQuery.data
	) {
		return <LoadingState />;
	}

	const segments = segmentsQuery.data;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<AudioPlayer audio={transcript.audio} />
			<div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<AudioLines className="size-3.5" />
					{segments.length} segments
				</span>
				<span>·</span>
				<span>{transcript.speakers.length} speakers</span>
				<span>·</span>
				<span className="uppercase">{transcript.language}</span>
			</div>
			<div className="min-h-0 flex-1">
				{segments.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
						This transcript has no segments yet.
					</div>
				) : (
					<TranscriptVirtualList
						segments={segments}
						speakers={transcript.speakers}
						transcriptId={transcript.id}
					/>
				)}
			</div>
		</div>
	);
}
