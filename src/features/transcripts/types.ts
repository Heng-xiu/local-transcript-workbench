/** Where the audio for a transcript comes from. */
export type AudioSourceKind = "recording" | "livekit";

/**
 * Describes the audio backing a transcript.
 *
 * In the MVP there is no real audio file, so `simulated` is true and playback
 * is driven by a virtual clock (see `useAudioTransport`). When a real backend
 * provides a playable `url`, set `simulated` to false and an `<audio>` element
 * is used instead — no other code changes are required.
 */
export interface AudioSource {
	kind: AudioSourceKind;
	/** Playable media URL, or null for pure-mock/placeholder sources. */
	url: string | null;
	durationSec: number;
	mimeType?: string;
	/** Drive playback with a virtual clock instead of an HTMLAudioElement. */
	simulated: boolean;
	/** LiveKit connection placeholder — never used to actually connect in MVP. */
	livekit?: {
		wsUrl: string | null;
		roomName: string | null;
		tokenEndpoint: string | null;
	};
}

/** A diarised speaker within a transcript. */
export interface Speaker {
	id: string;
	label: string;
	/** Tailwind-friendly accent token used to colour the speaker in the UI. */
	color: string;
}

/**
 * A transcript ties together an audio source, its speakers, and the ordered
 * list of segment ids. Segment bodies are fetched separately so the list can
 * be virtualised and edited independently.
 */
export interface Transcript {
	id: string;
	projectId: string;
	language: string;
	audio: AudioSource;
	speakers: Speaker[];
	/** Ordered segment ids. */
	segmentIds: string[];
	createdAt: string;
	updatedAt: string;
	/** Bumped by the backend whenever any segment is saved. */
	revision: number;
}
