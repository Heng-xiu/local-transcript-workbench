import { CalendarClock, Clock, FileCheck2, FileText, Mic } from "lucide-react";
import { useMemo } from "react";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingsQuery } from "@/features/meetings/queries";
import type { Meeting } from "@/features/meetings/types";
import { useMeetingRecordsQuery } from "@/features/records/queries";
import {
	MEETING_RECORD_STATUS_LABELS,
	type MeetingRecordStatus,
} from "@/features/records/types";
import { useTranscriptListItemsQuery } from "@/features/transcripts/queries";
import {
	TRANSCRIPT_STATUS_LABELS,
	type TranscriptStatus,
} from "@/features/transcripts/types";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDuration } from "@/lib/utils/time";
import { MeetingStatusBadge } from "./MeetingStatusBadge";

interface MeetingSidebarProps {
	selectedMeetingId: string | undefined;
	onSelect: (meetingId: string) => void;
}

const SKELETON_KEYS = ["m1", "m2", "m3", "m4", "m5"] as const;

function MeetingListItem({
	meeting,
	selected,
	transcriptStatus,
	recordStatus,
	onSelect,
}: {
	meeting: Meeting;
	selected: boolean;
	transcriptStatus?: TranscriptStatus;
	recordStatus?: MeetingRecordStatus;
	onSelect: (meetingId: string) => void;
}) {
	const when =
		meeting.status === "scheduled" ? meeting.scheduledAt : meeting.startedAt;
	return (
		<button
			type="button"
			onClick={() => onSelect(meeting.id)}
			aria-current={selected ? "true" : undefined}
			className={cn(
				"flex w-full flex-col gap-1.5 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors",
				"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				selected && "border-border bg-accent",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
					{meeting.title}
				</span>
				<MeetingStatusBadge status={meeting.status} />
			</div>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
				{when ? (
					<span className="inline-flex items-center gap-1">
						<CalendarClock className="size-3" />
						{formatDateTime(when)}
					</span>
				) : null}
				{typeof meeting.durationMs === "number" ? (
					<span className="inline-flex items-center gap-1 tabular-nums">
						<Clock className="size-3" />
						{formatDuration(meeting.durationMs / 1000)}
					</span>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
				{meeting.recordingAssetId ? (
					<span className="inline-flex items-center gap-1">
						<Mic className="size-3" />
						Recording
					</span>
				) : null}
				{transcriptStatus ? (
					<span className="inline-flex items-center gap-1">
						<FileText className="size-3" />
						{TRANSCRIPT_STATUS_LABELS[transcriptStatus]}
					</span>
				) : null}
				{recordStatus ? (
					<span className="inline-flex items-center gap-1">
						<FileCheck2 className="size-3" />
						{MEETING_RECORD_STATUS_LABELS[recordStatus]}
					</span>
				) : null}
			</div>
		</button>
	);
}

export function MeetingSidebar({
	selectedMeetingId,
	onSelect,
}: MeetingSidebarProps) {
	const meetingsQuery = useMeetingsQuery();
	const transcriptsQuery = useTranscriptListItemsQuery();
	const recordsQuery = useMeetingRecordsQuery();

	const transcriptStatusById = useMemo(() => {
		const map = new Map<string, TranscriptStatus>();
		for (const t of transcriptsQuery.data ?? []) map.set(t.id, t.status);
		return map;
	}, [transcriptsQuery.data]);

	const recordStatusById = useMemo(() => {
		const map = new Map<string, MeetingRecordStatus>();
		for (const r of recordsQuery.data ?? []) map.set(r.id, r.status);
		return map;
	}, [recordsQuery.data]);

	const meetings = meetingsQuery.data ?? [];

	return (
		<ContextSidebar
			title="Meetings"
			count={meetingsQuery.data?.length}
			description="LiveKit session history"
		>
			{meetingsQuery.isPending ? (
				SKELETON_KEYS.map((key) => (
					<Skeleton key={key} className="h-20 w-full rounded-md" />
				))
			) : meetingsQuery.isError ? (
				<p className="px-3 py-6 text-sm text-destructive">
					Failed to load meetings.
				</p>
			) : meetings.length === 0 ? (
				<p className="px-3 py-6 text-sm text-muted-foreground">
					No meetings yet.
				</p>
			) : (
				meetings.map((meeting) => (
					<MeetingListItem
						key={meeting.id}
						meeting={meeting}
						selected={meeting.id === selectedMeetingId}
						transcriptStatus={
							meeting.transcriptId
								? transcriptStatusById.get(meeting.transcriptId)
								: undefined
						}
						recordStatus={
							meeting.recordId
								? recordStatusById.get(meeting.recordId)
								: undefined
						}
						onSelect={onSelect}
					/>
				))
			)}
		</ContextSidebar>
	);
}
