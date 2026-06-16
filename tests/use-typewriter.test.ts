import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTypewriter } from "@/features/records/use-typewriter";

describe("useTypewriter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns full text immediately when enabled=false", () => {
		const { result } = renderHook(() =>
			useTypewriter("Hello world", false),
		);
		expect(result.current).toBe("Hello world");
	});

	it("starts with empty string when enabled=true", () => {
		const { result } = renderHook(() =>
			useTypewriter("Hello world", true, 4, 50),
		);
		expect(result.current).toBe("");
	});

	it("progressively reveals text as timers advance", () => {
		const full = "ABCDEFGHIJ"; // 10 chars
		const { result } = renderHook(() =>
			useTypewriter(full, true, 4, 50),
		);

		// Initially empty
		expect(result.current).toBe("");

		// After one tick: 4 chars
		act(() => {
			vi.advanceTimersByTime(50);
		});
		expect(result.current).toBe("ABCD");

		// After second tick: 8 chars
		act(() => {
			vi.advanceTimersByTime(50);
		});
		expect(result.current).toBe("ABCDEFGH");

		// After third tick: 10 chars (clamped to full.length)
		act(() => {
			vi.advanceTimersByTime(50);
		});
		expect(result.current).toBe("ABCDEFGHIJ");
	});

	it("reaches the full text length eventually", () => {
		const full = "Short text";
		const { result } = renderHook(() =>
			useTypewriter(full, true, 3, 20),
		);

		// Advance enough time to cover all characters
		act(() => {
			vi.advanceTimersByTime(20 * Math.ceil(full.length / 3) + 20);
		});
		expect(result.current).toBe(full);
	});

	it("resets to full text immediately when enabled switches to false", () => {
		const full = "Some text";
		let enabled = true;
		const { result, rerender } = renderHook(
			({ text, en }: { text: string; en: boolean }) =>
				useTypewriter(text, en, 2, 50),
			{ initialProps: { text: full, en: enabled } },
		);

		// After one tick, partial content
		act(() => {
			vi.advanceTimersByTime(50);
		});
		expect(result.current.length).toBeGreaterThan(0);
		expect(result.current.length).toBeLessThan(full.length);

		// Disable animation
		enabled = false;
		rerender({ text: full, en: enabled });
		expect(result.current).toBe(full);
	});

	it("handles empty string gracefully when enabled=true", () => {
		const { result } = renderHook(() =>
			useTypewriter("", true, 4, 50),
		);
		expect(result.current).toBe("");
		// Advance timers - no interval should be set, no errors
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("");
	});
});
