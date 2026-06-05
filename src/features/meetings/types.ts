/**
 * A meeting is a local/self-hosted LiveKit-backed session (conceptually like a
 * Google Meet meeting/session). It is the *source* of a transcript and record —
 * **not** the transcript editor. The MVP never opens a real LiveKit connection;
 * the Meetings section is a session/history list, not a meeting room.
 */
export type MeetingStatus = "scheduled" | "live" | "ended";

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
	scheduled: "Scheduled",
	live: "Live",
	ended: "Ended",
};

export interface Meeting {
	id: string;
	title: string;
	status: MeetingStatus;
	/** LiveKit room name (placeholder; never joined in the MVP). */
	livekitRoomName?: string;
	/** ISO 8601 timestamps. */
	scheduledAt?: string;
	startedAt?: string;
	endedAt?: string;
	durationMs?: number;
	/** Recording asset produced by the session, if any. */
	recordingAssetId?: string;
	/** Linked transcript artifact, if one has been generated. */
	transcriptId?: string;
	/** Linked formal meeting record, if one exists. */
	recordId?: string;
	/** Optional grouping metadata. Projects are not a primary nav concept in MVP. */
	projectName?: string;
	updatedAt: string;
}
