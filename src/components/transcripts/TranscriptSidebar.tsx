import { Clock, Timer, Video } from "lucide-react";
import { useMemo } from "react";
import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingsQuery } from "@/features/meetings/queries";
import { useTranscriptListItemsQuery } from "@/features/transcripts/queries";
import type { TranscriptListItem } from "@/features/transcripts/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatRelativeTime } from "@/lib/utils/time";
import { TranscriptStatusBadge } from "./TranscriptStatusBadge";

interface TranscriptSidebarProps {
	selectedTranscriptId: string | undefined;
	onSelect: (transcriptId: string) => void;
}

const SKELETON_KEYS = ["t1", "t2", "t3", "t4", "t5"] as const;

function TranscriptListRow({
	item,
	meetingTitle,
	selected,
	onSelect,
}: {
	item: TranscriptListItem;
	meetingTitle: string | undefined;
	selected: boolean;
	onSelect: (transcriptId: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(item.id)}
			aria-current={selected ? "true" : undefined}
			className={cn(
				"flex w-full flex-col gap-1.5 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors",
				"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				selected && "border-border bg-accent",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">
					{item.title}
				</span>
				<TranscriptStatusBadge status={item.status} />
			</div>
			{meetingTitle ? (
				<span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
					<Video className="size-3 shrink-0" />
					<span className="min-w-0 truncate">{meetingTitle}</span>
				</span>
			) : null}
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<Clock className="size-3" />
					{formatRelativeTime(item.updatedAt)}
				</span>
				{typeof item.durationMs === "number" ? (
					<span className="inline-flex items-center gap-1 tabular-nums">
						<Timer className="size-3" />
						{formatDuration(item.durationMs / 1000)}
					</span>
				) : null}
			</div>
		</button>
	);
}

export function TranscriptSidebar({
	selectedTranscriptId,
	onSelect,
}: TranscriptSidebarProps) {
	const transcriptsQuery = useTranscriptListItemsQuery();
	const meetingsQuery = useMeetingsQuery();

	const meetingTitleById = useMemo(() => {
		const map = new Map<string, string>();
		for (const m of meetingsQuery.data ?? []) map.set(m.id, m.title);
		return map;
	}, [meetingsQuery.data]);

	const items = transcriptsQuery.data ?? [];

	return (
		<ContextSidebar
			title="Transcripts"
			count={transcriptsQuery.data?.length}
			description="Correction artifacts"
		>
			{transcriptsQuery.isPending ? (
				SKELETON_KEYS.map((key) => (
					<Skeleton key={key} className="h-18 w-full rounded-md" />
				))
			) : transcriptsQuery.isError ? (
				<p className="px-3 py-6 text-sm text-destructive">
					Failed to load transcripts.
				</p>
			) : items.length === 0 ? (
				<p className="px-3 py-6 text-sm text-muted-foreground">
					No transcripts yet.
				</p>
			) : (
				items.map((item) => (
					<TranscriptListRow
						key={item.id}
						item={item}
						meetingTitle={
							item.meetingId ? meetingTitleById.get(item.meetingId) : undefined
						}
						selected={item.id === selectedTranscriptId}
						onSelect={onSelect}
					/>
				))
			)}
		</ContextSidebar>
	);
}
