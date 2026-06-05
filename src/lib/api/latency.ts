/**
 * Helpers that make the mock API feel like a real network: artificial latency,
 * abort support, and a deterministic failure trigger so the save error/retry
 * path is demonstrable and testable.
 */

/** Resolves after `ms`, or rejects if the optional signal aborts first. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(() => {
			signal?.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		function onAbort() {
			clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		}
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}

/**
 * Deterministic failure trigger for demos/tests. Any segment text containing
 * the marker `[[fail]]` (case-insensitive) will cause its save to fail, letting
 * you exercise the error + retry UI on demand.
 */
export const FAILURE_MARKER = "[[fail]]";

export function shouldSimulateSaveFailure(text: string): boolean {
	return text.toLowerCase().includes(FAILURE_MARKER);
}

export class MockApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MockApiError";
	}
}
