/**
 * Playback is shared state: the audio player writes to it, while the transcript
 * list reads `currentTime` to highlight the active segment and `seek` is called
 * when a timestamp is clicked. A TanStack Store keeps these decoupled — neither
 * component owns the clock.
 */
import { Store } from "@tanstack/store";

export interface PlaybackState {
	/** Transcript currently loaded into the transport, or null. */
	transcriptId: string | null;
	isPlaying: boolean;
	/** Seconds. */
	currentTime: number;
	/** Seconds. */
	duration: number;
	playbackRate: number;
}

const INITIAL: PlaybackState = {
	transcriptId: null,
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	playbackRate: 1,
};

export const playbackStore = new Store<PlaybackState>(INITIAL);

function set(patch: Partial<PlaybackState>): void {
	playbackStore.setState((prev) => ({ ...prev, ...patch }));
}

function clamp(time: number, duration: number): number {
	if (!Number.isFinite(time) || time < 0) return 0;
	return duration > 0 ? Math.min(time, duration) : time;
}

export const playbackActions = {
	/** Load a transcript's audio into the transport, resetting position. */
	load(transcriptId: string, duration: number): void {
		set({
			transcriptId,
			duration,
			currentTime: 0,
			isPlaying: false,
		});
	},
	play(): void {
		set({ isPlaying: true });
	},
	pause(): void {
		set({ isPlaying: false });
	},
	toggle(): void {
		set({ isPlaying: !playbackStore.state.isPlaying });
	},
	/** Move the playhead (clamped to [0, duration]). */
	seek(time: number): void {
		const { duration } = playbackStore.state;
		set({ currentTime: clamp(time, duration) });
	},
	/** Advance the playhead from the transport clock; auto-stops at the end. */
	tick(time: number): void {
		const { duration } = playbackStore.state;
		const next = clamp(time, duration);
		if (duration > 0 && next >= duration) {
			set({ currentTime: duration, isPlaying: false });
			return;
		}
		set({ currentTime: next });
	},
	setDuration(duration: number): void {
		set({ duration });
	},
	setRate(playbackRate: number): void {
		set({ playbackRate });
	},
	reset(): void {
		playbackStore.setState(() => ({ ...INITIAL }));
	},
};
