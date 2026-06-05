import { useStore } from "@tanstack/react-store";
import { useEffect, useRef } from "react";
import type { AudioSource } from "@/features/transcripts/types";
import { playbackActions, playbackStore } from "@/lib/stores/playback-store";

/**
 * Drives the shared playback store from a clock.
 *
 * - Mock sources (`simulated: true`, the MVP default) advance via a
 *   requestAnimationFrame loop, so play/pause/seek/progress all work with no
 *   real audio file.
 * - When the backend later provides a playable `url` (`simulated: false`) the
 *   exact same store is driven by an HTMLAudioElement instead — no UI changes.
 *
 * UI controls always go through `playbackActions`; this hook only translates
 * between the store and the clock.
 */
export function useAudioTransport(audio: AudioSource | undefined): void {
	const isPlaying = useStore(playbackStore, (s) => s.isPlaying);
	const playbackRate = useStore(playbackStore, (s) => s.playbackRate);
	const currentTime = useStore(playbackStore, (s) => s.currentTime);
	const rafRef = useRef<number | null>(null);
	const audioElRef = useRef<HTMLAudioElement | null>(null);
	const simulated = audio?.simulated ?? true;

	// Simulated clock.
	useEffect(() => {
		if (!audio || !simulated || !isPlaying) return;
		let lastTs: number | null = null;
		const step = (ts: number) => {
			if (lastTs === null) lastTs = ts;
			const deltaSec = ((ts - lastTs) / 1000) * playbackRate;
			lastTs = ts;
			playbackActions.tick(playbackStore.state.currentTime + deltaSec);
			if (playbackStore.state.isPlaying) {
				rafRef.current = requestAnimationFrame(step);
			}
		};
		rafRef.current = requestAnimationFrame(step);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		};
	}, [audio, simulated, isPlaying, playbackRate]);

	// Real-audio element lifecycle (unused in MVP mock mode).
	useEffect(() => {
		if (!audio || simulated || !audio.url) return;
		const el = new Audio(audio.url);
		el.preload = "metadata";
		audioElRef.current = el;
		const onMeta = () =>
			playbackActions.setDuration(el.duration || audio.durationSec);
		const onTime = () => playbackActions.tick(el.currentTime);
		const onEnded = () => playbackActions.pause();
		el.addEventListener("loadedmetadata", onMeta);
		el.addEventListener("timeupdate", onTime);
		el.addEventListener("ended", onEnded);
		return () => {
			el.pause();
			el.removeEventListener("loadedmetadata", onMeta);
			el.removeEventListener("timeupdate", onTime);
			el.removeEventListener("ended", onEnded);
			audioElRef.current = null;
		};
	}, [audio, simulated]);

	useEffect(() => {
		if (simulated) return;
		const el = audioElRef.current;
		if (!el) return;
		if (isPlaying) {
			void el.play().catch(() => playbackActions.pause());
		} else {
			el.pause();
		}
	}, [isPlaying, simulated]);

	useEffect(() => {
		if (simulated) return;
		const el = audioElRef.current;
		if (el) el.playbackRate = playbackRate;
	}, [playbackRate, simulated]);

	// Apply external seeks to the real element (guarded to avoid feedback loops).
	useEffect(() => {
		if (simulated) return;
		const el = audioElRef.current;
		if (el && Math.abs(el.currentTime - currentTime) > 0.4) {
			el.currentTime = currentTime;
		}
	}, [currentTime, simulated]);
}
