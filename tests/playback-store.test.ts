import { beforeEach, describe, expect, it } from "vitest";
import { playbackActions, playbackStore } from "@/lib/stores/playback-store";

describe("playbackStore", () => {
	beforeEach(() => {
		playbackActions.reset();
	});

	it("loads a transcript and resets position", () => {
		playbackActions.load("tr_1", 120);
		expect(playbackStore.state.transcriptId).toBe("tr_1");
		expect(playbackStore.state.duration).toBe(120);
		expect(playbackStore.state.currentTime).toBe(0);
		expect(playbackStore.state.isPlaying).toBe(false);
	});

	it("toggles play state", () => {
		playbackActions.play();
		expect(playbackStore.state.isPlaying).toBe(true);
		playbackActions.toggle();
		expect(playbackStore.state.isPlaying).toBe(false);
	});

	it("clamps seeks within [0, duration]", () => {
		playbackActions.load("tr_1", 60);
		playbackActions.seek(-10);
		expect(playbackStore.state.currentTime).toBe(0);
		playbackActions.seek(90);
		expect(playbackStore.state.currentTime).toBe(60);
		playbackActions.seek(30);
		expect(playbackStore.state.currentTime).toBe(30);
	});

	it("auto-stops when the clock reaches the end", () => {
		playbackActions.load("tr_1", 10);
		playbackActions.play();
		playbackActions.tick(10.5);
		expect(playbackStore.state.currentTime).toBe(10);
		expect(playbackStore.state.isPlaying).toBe(false);
	});
});
