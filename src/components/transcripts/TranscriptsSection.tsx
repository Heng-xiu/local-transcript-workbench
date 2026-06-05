import { FileText, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { AIOutputPanel } from "@/components/ai-output/AIOutputPanel";
import { TranscriptWorkbench } from "@/components/transcript/TranscriptWorkbench";
import { useMeetingsQuery } from "@/features/meetings/queries";
import {
	useTranscriptListItemsQuery,
	useTranscriptQuery,
} from "@/features/transcripts/queries";
import { TranscriptFailedView } from "./TranscriptFailedView";
import { TranscriptProcessingView } from "./TranscriptProcessingView";
import { TranscriptSidebar } from "./TranscriptSidebar";

interface TranscriptsSectionProps {
	transcriptId: string | undefined;
	onSelectTranscript: (transcriptId: string) => void;
}

function EmptyMain() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
			<FileText className="size-10 opacity-40" />
			<p className="text-sm">
				Select a transcript. Ready transcripts open the editor; processing and
				failed transcripts show their status.
			</p>
		</div>
	);
}

/**
 * Owns the Transcripts column layout and the status gate: only a
 * `ready_for_edit` transcript opens the existing virtualised editor (with the
 * AI output panel on the right). Processing/failed transcripts render their
 * dedicated status views instead — the editor is never shown for them.
 */
export function TranscriptsSection({
	transcriptId,
	onSelectTranscript,
}: TranscriptsSectionProps) {
	const transcriptsQuery = useTranscriptListItemsQuery();
	const meetingsQuery = useMeetingsQuery();
	const transcriptQuery = useTranscriptQuery(transcriptId);

	const selectedItem = useMemo(
		() => transcriptsQuery.data?.find((t) => t.id === transcriptId),
		[transcriptsQuery.data, transcriptId],
	);
	const meetingTitle = selectedItem?.meetingId
		? meetingsQuery.data?.find((m) => m.id === selectedItem.meetingId)?.title
		: undefined;

	const status = selectedItem?.status;
	const isEditor = Boolean(transcriptId) && status === "ready_for_edit";

	const sidebar = (
		<TranscriptSidebar
			selectedTranscriptId={transcriptId}
			onSelect={onSelectTranscript}
		/>
	);

	if (isEditor && selectedItem) {
		return (
			<div className="grid h-full min-h-0 grid-cols-[18rem_minmax(0,1fr)_24rem]">
				{sidebar}
				<section className="min-w-0 overflow-hidden">
					<TranscriptWorkbench transcriptId={transcriptId} />
				</section>
				<AIOutputPanel
					projectId={transcriptQuery.data?.projectId}
					transcriptId={transcriptId}
				/>
			</div>
		);
	}

	let main: React.ReactNode;
	if (!transcriptId) {
		main = <EmptyMain />;
	} else if (transcriptsQuery.isPending) {
		main = (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<Loader2 className="size-5 animate-spin" />
			</div>
		);
	} else if (!selectedItem) {
		main = (
			<div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
				Transcript not found.
			</div>
		);
	} else if (status === "processing") {
		main = (
			<TranscriptProcessingView
				transcript={selectedItem}
				meetingTitle={meetingTitle}
			/>
		);
	} else if (status === "failed") {
		main = (
			<TranscriptFailedView
				transcript={selectedItem}
				meetingTitle={meetingTitle}
			/>
		);
	} else {
		main = <EmptyMain />;
	}

	return (
		<div className="grid h-full min-h-0 grid-cols-[18rem_minmax(0,1fr)]">
			{sidebar}
			<section className="min-w-0 overflow-hidden">{main}</section>
		</div>
	);
}
