/**
 * Meetings adapter backed by the real meeting-api service.
 *
 * Composed over the base adapter in `lib/api/index.ts` when
 * `VITE_MEETING_API_BASE_URL` is set (hybrid mode). meeting-api returns its own
 * `MeetingResponse` shape, so unlike the transcript adapter these methods map
 * the payload into the workbench `Meeting` type here.
 *
 * The base URL includes meeting-api's `/api` prefix, so paths are `/meetings…`.
 */
import type { Meeting, MeetingStatus } from "@/features/meetings/types";
import { env } from "@/lib/config/env";
import type { CreateMeetingInput, WorkbenchApi } from "./types";

interface MeetingApiResponse {
	meetingId: string;
	meetingCode: string;
	title: string;
	roomName: string;
	status: "created" | "live" | "ending" | "ended";
	joinable: boolean;
	owner: { id: string; displayName: string };
	hostIdentity: string;
	createdAt: string;
	startedAt: string | null;
	endingAt: string | null;
	endedAt: string | null;
}

function mapStatus(status: MeetingApiResponse["status"]): MeetingStatus {
	switch (status) {
		case "created":
			return "scheduled";
		case "live":
		case "ending":
			return "live";
		case "ended":
			return "ended";
	}
}

function toMeeting(r: MeetingApiResponse): Meeting {
	const status = mapStatus(r.status);
	const durationMs =
		r.startedAt && r.endedAt
			? new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()
			: undefined;
	return {
		id: r.meetingCode,
		title: r.title,
		status,
		livekitRoomName: r.roomName,
		scheduledAt: status === "scheduled" ? r.createdAt : undefined,
		startedAt: r.startedAt ?? undefined,
		endedAt: r.endedAt ?? undefined,
		durationMs,
		updatedAt: r.endedAt ?? r.startedAt ?? r.createdAt,
	};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const url = `${env.meetingApiBaseUrl}${path}`;
	const res = init
		? await fetch(url, {
				...init,
				headers: { "content-type": "application/json", ...init.headers },
			})
		: await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} for ${path}`);
	}
	return (await res.json()) as T;
}

export const meetingApiMeetings = {
	async listMeetings(): Promise<Meeting[]> {
		const rows = await request<MeetingApiResponse[]>("/meetings");
		return rows.map(toMeeting);
	},
	async getMeeting(meetingId: string): Promise<Meeting> {
		const row = await request<MeetingApiResponse>(
			`/meetings/${encodeURIComponent(meetingId)}`,
		);
		return toMeeting(row);
	},
	async createMeeting(input?: CreateMeetingInput): Promise<Meeting> {
		const row = await request<MeetingApiResponse>("/meetings", {
			method: "POST",
			body: JSON.stringify(input ?? {}),
		});
		return toMeeting(row);
	},
} satisfies Pick<WorkbenchApi, "listMeetings" | "getMeeting" | "createMeeting">;
