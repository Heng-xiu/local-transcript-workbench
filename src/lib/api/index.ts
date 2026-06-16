/**
 * The single place backends are selected. Components and feature hooks import
 * `api` from here and never know whether they are talking to the mock or the
 * real backend. Flip backends by setting `VITE_API_BASE_URL`.
 */
import { env } from "@/lib/config/env";
import { httpApi } from "./http-api";
import { meetingApiMeetings } from "./meeting-api-meetings";
import { meetingApiRecords } from "./meeting-api-records";
import { meetingApiTranscripts } from "./meeting-api-transcripts";
import { mockApi } from "./mock-api";
import type { WorkbenchApi } from "./types";

const base = env.useMockApi ? mockApi : httpApi;

/**
 * Hybrid mode: when `VITE_MEETING_API_BASE_URL` is set, the four transcript
 * *read* methods plus `updateSegment` (segment edit), meetings (list/get/create),
 * and records (`generateMeetingRecord` + `listMeetingRecords` + `getMeetingRecord`)
 * are routed to meeting-api while every other method stays on the base adapter.
 * When it is unset, `api === base`, identical to the previous behaviour.
 */
export const api: WorkbenchApi = env.useMeetingApiTranscripts
	? {
			...base,
			...meetingApiTranscripts,
			...meetingApiMeetings,
			...meetingApiRecords,
		}
	: base;

export type * from "./types";
