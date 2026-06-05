import {
	AlertTriangle,
	Cloud,
	Cpu,
	FileCheck2,
	FileText,
	Loader2,
	RotateCcw,
	Sparkles,
	Video,
} from "lucide-react";
import { MarkdownView } from "@/components/ai-output/MarkdownView";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { templateName } from "@/features/ai/templates";
import { useMeetingsQuery } from "@/features/meetings/queries";
import {
	useGenerateMeetingRecordMutation,
	useMeetingRecordQuery,
} from "@/features/records/queries";
import { useTranscriptListItemsQuery } from "@/features/transcripts/queries";
import { env } from "@/lib/config/env";
import { RecordExportControls } from "./RecordExportControls";
import { RecordStatusBadge } from "./RecordStatusBadge";

interface MeetingRecordDetailProps {
	recordId: string | undefined;
}

function ProviderTag() {
	const isLocal = env.aiProviderMode === "local";
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
			{isLocal ? <Cpu className="size-3" /> : <Cloud className="size-3" />}
			{isLocal ? "Local LLM" : "OpenRouter"}
		</span>
	);
}

function MetaRow({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof FileText;
	label: string;
	value: string;
}) {
	return (
		<span className="flex min-w-0 max-w-full items-center gap-1 text-xs text-muted-foreground">
			<Icon className="size-3.5 shrink-0" />
			<span className="shrink-0 font-medium text-foreground/70">{label}:</span>
			<span className="min-w-0 truncate">{value}</span>
		</span>
	);
}

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
			<FileCheck2 className="size-10 opacity-40" />
			<p className="text-sm">Select a record to view or generate it.</p>
		</div>
	);
}

export function MeetingRecordDetail({ recordId }: MeetingRecordDetailProps) {
	const recordQuery = useMeetingRecordQuery(recordId);
	const meetingsQuery = useMeetingsQuery();
	const transcriptsQuery = useTranscriptListItemsQuery();
	const generate = useGenerateMeetingRecordMutation();

	if (!recordId) return <EmptyState />;

	if (recordQuery.isPending) {
		return (
			<div className="flex flex-col gap-4 p-6">
				<Skeleton className="h-8 w-72" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (recordQuery.isError || !recordQuery.data) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center text-sm text-destructive">
				Failed to load record.
			</div>
		);
	}

	const record = recordQuery.data;
	const meetingTitle = record.meetingId
		? meetingsQuery.data?.find((m) => m.id === record.meetingId)?.title
		: undefined;
	const transcriptTitle = transcriptsQuery.data?.find(
		(t) => t.id === record.transcriptId,
	)?.title;

	const generating = generate.isPending || record.status === "generating";
	const failed = generate.isError || record.status === "failed";

	function runGeneration() {
		generate.mutate({
			transcriptId: record.transcriptId,
			templateId: record.templateId,
		});
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex flex-col gap-2 border-b px-6 py-4">
				<div className="flex items-start gap-3">
					<h1 className="min-w-0 text-lg font-semibold">{record.title}</h1>
					<RecordStatusBadge status={record.status} />
				</div>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					{meetingTitle ? (
						<MetaRow icon={Video} label="Meeting" value={meetingTitle} />
					) : null}
					{transcriptTitle ? (
						<MetaRow
							icon={FileText}
							label="Transcript"
							value={transcriptTitle}
						/>
					) : null}
					<MetaRow
						icon={Sparkles}
						label="Template"
						value={templateName(record.templateId)}
					/>
				</div>
			</header>

			{generating ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
					<Loader2 className="size-9 animate-spin text-muted-foreground" />
					<div className="flex flex-col items-center gap-2">
						<p className="text-sm font-medium">Generating meeting record…</p>
						<div className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground">
								{templateName(record.templateId)}
							</span>
							<ProviderTag />
						</div>
						<p className="max-w-sm text-xs text-muted-foreground">
							Generation runs as a backend job. API keys never touch the
							frontend.
						</p>
					</div>
				</div>
			) : record.markdown ? (
				<>
					<ScrollArea className="min-h-0 flex-1">
						<div className="p-6">
							<MarkdownView markdown={record.markdown} />
						</div>
					</ScrollArea>
					<RecordExportControls record={record} />
				</>
			) : failed ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
					<AlertTriangle className="size-9 text-destructive" />
					<p className="max-w-sm text-sm text-destructive">
						Record generation failed. The transcript could not be turned into a
						meeting record.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={runGeneration}
						disabled={generate.isPending}
					>
						<RotateCcw className="size-4" /> Retry generation
					</Button>
				</div>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
					<FileCheck2 className="size-9 opacity-40" />
					<div className="flex flex-col items-center gap-1">
						<p className="text-sm font-medium">No record generated yet</p>
						<div className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground">
								{templateName(record.templateId)}
							</span>
							<ProviderTag />
						</div>
					</div>
					<Button type="button" size="sm" onClick={runGeneration}>
						<Sparkles className="size-4" /> Generate record
					</Button>
				</div>
			)}
		</div>
	);
}
