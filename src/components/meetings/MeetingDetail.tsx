import {
	CalendarClock,
	FileCheck2,
	FileText,
	Mic,
	Radio,
	Video,
} from "lucide-react";
import { RecordStatusBadge } from "@/components/records/RecordStatusBadge";
import { TranscriptStatusBadge } from "@/components/transcripts/TranscriptStatusBadge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingQuery } from "@/features/meetings/queries";
import { useMeetingRecordsQuery } from "@/features/records/queries";
import { useTranscriptListItemsQuery } from "@/features/transcripts/queries";
import { formatDateTime, formatDuration } from "@/lib/utils/time";
import { MeetingStatusBadge } from "./MeetingStatusBadge";

interface MeetingDetailProps {
	meetingId: string | undefined;
	onOpenTranscript: (transcriptId: string) => void;
	onOpenRecord: (recordId: string) => void;
}

function Field({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-sm tabular-nums">{value || "—"}</span>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
			<Video className="size-10 opacity-40" />
			<p className="text-sm">Select a meeting to see its session details.</p>
		</div>
	);
}

export function MeetingDetail({
	meetingId,
	onOpenTranscript,
	onOpenRecord,
}: MeetingDetailProps) {
	const meetingQuery = useMeetingQuery(meetingId);
	const transcriptsQuery = useTranscriptListItemsQuery();
	const recordsQuery = useMeetingRecordsQuery();

	if (!meetingId) return <EmptyState />;

	if (meetingQuery.isPending) {
		return (
			<div className="flex flex-col gap-4 p-6">
				<Skeleton className="h-8 w-72" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	if (meetingQuery.isError || !meetingQuery.data) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center text-sm text-destructive">
				Failed to load meeting.
			</div>
		);
	}

	const meeting = meetingQuery.data;
	const transcript = meeting.transcriptId
		? transcriptsQuery.data?.find((t) => t.id === meeting.transcriptId)
		: undefined;
	const record = meeting.recordId
		? recordsQuery.data?.find((r) => r.id === meeting.recordId)
		: undefined;
	const transcriptReady = transcript?.status === "ready_for_edit";

	return (
		<div className="h-full min-h-0 overflow-y-auto">
			<div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
				<header className="flex flex-col gap-2">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-semibold">{meeting.title}</h1>
						<MeetingStatusBadge status={meeting.status} />
					</div>
					{meeting.projectName ? (
						<p className="text-sm text-muted-foreground">
							{meeting.projectName}
						</p>
					) : null}
				</header>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<CalendarClock className="size-4" /> Session
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Field
							label="Scheduled"
							value={formatDateTime(meeting.scheduledAt)}
						/>
						<Field label="Started" value={formatDateTime(meeting.startedAt)} />
						<Field label="Ended" value={formatDateTime(meeting.endedAt)} />
						<Field
							label="Duration"
							value={
								typeof meeting.durationMs === "number"
									? formatDuration(meeting.durationMs / 1000)
									: ""
							}
						/>
					</CardContent>
				</Card>

				<div className="grid gap-4 sm:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm">
								<Radio className="size-4" /> Local LiveKit room
							</CardTitle>
							<CardDescription>
								Placeholder — the MVP never opens a real LiveKit connection.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<Field label="Room" value={meeting.livekitRoomName ?? ""} />
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-fit"
								disabled={meeting.status === "ended"}
								title="LiveKit join is a placeholder in the MVP."
							>
								<Video className="size-4" /> Join meeting
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm">
								<Mic className="size-4" /> Recording asset
							</CardTitle>
							<CardDescription>
								Streamed from the backend later (placeholder).
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Field
								label="Asset"
								value={
									meeting.recordingAssetId
										? meeting.recordingAssetId
										: "No recording"
								}
							/>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<FileText className="size-4" /> Transcript
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap items-center justify-between gap-3">
						{transcript ? (
							<>
								<div className="flex items-center gap-2">
									<span className="text-sm">{transcript.title}</span>
									<TranscriptStatusBadge status={transcript.status} />
								</div>
								<Button
									type="button"
									size="sm"
									variant={transcriptReady ? "default" : "outline"}
									onClick={() => onOpenTranscript(transcript.id)}
								>
									{transcriptReady
										? "Open transcript"
										: "View transcript status"}
								</Button>
							</>
						) : (
							<p className="text-sm text-muted-foreground">
								No transcript has been generated for this meeting yet.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm">
							<FileCheck2 className="size-4" /> Meeting record
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap items-center justify-between gap-3">
						{record ? (
							<>
								<div className="flex items-center gap-2">
									<span className="text-sm">{record.title}</span>
									<RecordStatusBadge status={record.status} />
								</div>
								<Button
									type="button"
									size="sm"
									onClick={() => onOpenRecord(record.id)}
								>
									Open record
								</Button>
							</>
						) : (
							<p className="text-sm text-muted-foreground">
								No meeting record exists yet.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
