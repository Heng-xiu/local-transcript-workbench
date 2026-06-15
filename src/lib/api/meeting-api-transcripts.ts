/**
 * Transcript adapter backed by the real meeting-api service.
 *
 * The four transcript *read* methods plus `updateSegment` (segment edit, the
 * first write path) live here; they are composed over the selected base adapter
 * (mock or http) in `lib/api/index.ts` when `VITE_MEETING_API_BASE_URL` is set
 * (hybrid mode). Everything else — records, AI, templates, projects, settings,
 * livekit, meetings — stays on the base adapter.
 *
 * The base URL is expected to include meeting-api's `/api` prefix (e.g.
 * `http://localhost:4001/api`), so paths here are written as `/transcripts…`.
 * Return shapes are produced by meeting-api already aligned to the workbench
 * types, so no transformation happens on this side.
 */
import type { TranscriptSegment } from "@/features/segments/types";
import type {
	AudioSource,
	Transcript,
	TranscriptListItem,
} from "@/features/transcripts/types";
import { env } from "@/lib/config/env";
import type { UpdateSegmentInput, WorkbenchApi } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const url = `${env.meetingApiBaseUrl}${path}`;
	// Reads stay a bare GET (no init); writes carry a JSON body, so attach the
	// content-type header alongside whatever method/body the caller passed.
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

export const meetingApiTranscripts = {
	listTranscriptListItems(): Promise<TranscriptListItem[]> {
		return request<TranscriptListItem[]>("/transcripts");
	},
	getTranscript(transcriptId: string): Promise<Transcript> {
		return request<Transcript>(
			`/transcripts/${encodeURIComponent(transcriptId)}`,
		);
	},
	getAudioSource(transcriptId: string): Promise<AudioSource> {
		return request<AudioSource>(
			`/transcripts/${encodeURIComponent(transcriptId)}/audio`,
		);
	},
	listSegments(transcriptId: string): Promise<TranscriptSegment[]> {
		return request<TranscriptSegment[]>(
			`/transcripts/${encodeURIComponent(transcriptId)}/segments`,
		);
	},
	updateSegment(input: UpdateSegmentInput): Promise<TranscriptSegment> {
		return request<TranscriptSegment>(
			`/transcripts/${encodeURIComponent(input.transcriptId)}/segments/${encodeURIComponent(input.segmentId)}`,
			{
				method: "PATCH",
				body: JSON.stringify({
					text: input.text,
					baseRevision: input.baseRevision,
				}),
			},
		);
	},
} satisfies Pick<
	WorkbenchApi,
	| "listTranscriptListItems"
	| "getTranscript"
	| "getAudioSource"
	| "listSegments"
	| "updateSegment"
>;
