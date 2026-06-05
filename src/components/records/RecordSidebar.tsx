import { Clock, FileText, Sparkles, Video } from "lucide-react";
import { useMemo } from "react";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { templateName } from "@/features/ai/templates";
import { useMeetingsQuery } from "@/features/meetings/queries";
import { useMeetingRecordsQuery } from "@/features/records/queries";
import type { MeetingRecord } from "@/features/records/types";
import { useTranscriptListItemsQuery } from "@/features/transcripts/queries";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { RecordStatusBadge } from "./RecordStatusBadge";

interface RecordSidebarProps {
	selectedRecordId: string | undefined;
	onSelect: (recordId: string) => void;
}

const SKELETON_KEYS = ["r1", "r2", "r3", "r4", "r5"] as const;

function isExported(record: MeetingRecord): boolean {
	return Boolean(record.exportedDocxAt || record.exportedMarkdownAt);
}

function RecordListRow({
	record,
	meetingTitle,
	transcriptTitle,
	selected,
	onSelect,
}: {
	record: MeetingRecord;
	meetingTitle: string | undefined;
	transcriptTitle: string | undefined;
	selected: boolean;
	onSelect: (recordId: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(record.id)}
			aria-current={selected ? "true" : undefined}
			className={cn(
				"flex w-full flex-col gap-1.5 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors",
				"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				selected && "border-border bg-accent",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
					{record.title}
				</span>
				<RecordStatusBadge status={record.status} />
			</div>
			<div className="flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground">
				{meetingTitle ? (
					<span className="flex min-w-0 items-center gap-1">
						<Video className="size-3 shrink-0" />
						<span className="min-w-0 truncate">{meetingTitle}</span>
					</span>
				) : null}
				{transcriptTitle ? (
					<span className="flex min-w-0 items-center gap-1">
						<FileText className="size-3 shrink-0" />
						<span className="min-w-0 truncate">{transcriptTitle}</span>
					</span>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<Sparkles className="size-3" />
					{templateName(record.templateId)}
				</span>
				<span className="inline-flex items-center gap-1">
					<Clock className="size-3" />
					{formatRelativeTime(record.updatedAt)}
				</span>
				{isExported(record) ? (
					<span className="text-indigo-600 dark:text-indigo-400">Exported</span>
				) : null}
			</div>
		</button>
	);
}

export function RecordSidebar({
	selectedRecordId,
	onSelect,
}: RecordSidebarProps) {
	const recordsQuery = useMeetingRecordsQuery();
	const meetingsQuery = useMeetingsQuery();
	const transcriptsQuery = useTranscriptListItemsQuery();

	const meetingTitleById = useMemo(() => {
		const map = new Map<string, string>();
		for (const m of meetingsQuery.data ?? []) map.set(m.id, m.title);
		return map;
	}, [meetingsQuery.data]);

	const transcriptTitleById = useMemo(() => {
		const map = new Map<string, string>();
		for (const t of transcriptsQuery.data ?? []) map.set(t.id, t.title);
		return map;
	}, [transcriptsQuery.data]);

	const records = recordsQuery.data ?? [];

	return (
		<ContextSidebar
			title="Records"
			count={recordsQuery.data?.length}
			description="Formal deliverables"
		>
			{recordsQuery.isPending ? (
				SKELETON_KEYS.map((key) => (
					<Skeleton key={key} className="h-24 w-full rounded-md" />
				))
			) : recordsQuery.isError ? (
				<p className="px-3 py-6 text-sm text-destructive">
					Failed to load records.
				</p>
			) : records.length === 0 ? (
				<p className="px-3 py-6 text-sm text-muted-foreground">
					No records yet.
				</p>
			) : (
				records.map((record) => (
					<RecordListRow
						key={record.id}
						record={record}
						meetingTitle={
							record.meetingId
								? meetingTitleById.get(record.meetingId)
								: undefined
						}
						transcriptTitle={transcriptTitleById.get(record.transcriptId)}
						selected={record.id === selectedRecordId}
						onSelect={onSelect}
					/>
				))
			)}
		</ContextSidebar>
	);
}
