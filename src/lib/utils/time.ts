/** Time and duration formatting helpers shared across the workbench. */

function pad(n: number): string {
	return n < 10 ? `0${n}` : String(n);
}

/**
 * Clock format for the audio player: `M:SS`, or `H:MM:SS` past an hour.
 * Negative or non-finite inputs clamp to `0:00`.
 */
export function formatClock(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
	const whole = Math.floor(totalSeconds);
	const hours = Math.floor(whole / 3600);
	const minutes = Math.floor((whole % 3600) / 60);
	const seconds = whole % 60;
	if (hours > 0) {
		return `${hours}:${pad(minutes)}:${pad(seconds)}`;
	}
	return `${minutes}:${pad(seconds)}`;
}

/** Human duration for metadata, e.g. `38m 12s` or `1h 02m`. */
export function formatDuration(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
	const whole = Math.floor(totalSeconds);
	const hours = Math.floor(whole / 3600);
	const minutes = Math.floor((whole % 3600) / 60);
	const seconds = whole % 60;
	if (hours > 0) return `${hours}h ${pad(minutes)}m`;
	if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
	return `${seconds}s`;
}

/**
 * Absolute, locale-aware date-time for session metadata, e.g.
 * `Jun 4, 2026, 9:00 AM`. Returns an empty string for unparseable input.
 */
export function formatDateTime(iso: string | undefined): string {
	if (!iso) return "";
	const ms = Date.parse(iso);
	if (Number.isNaN(ms)) return "";
	return new Date(ms).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

/** Human-readable bytes, e.g. `58.4 GB`. */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = bytes / 1024 ** exponent;
	return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Relative time such as `just now`, `3h ago`, `2d ago`. */
export function formatRelativeTime(
	iso: string,
	nowMs: number = Date.now(),
): string {
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return "";
	const deltaSec = Math.round((nowMs - then) / 1000);
	if (deltaSec < 45) return "just now";
	const deltaMin = Math.round(deltaSec / 60);
	if (deltaMin < 60) return `${deltaMin}m ago`;
	const deltaHr = Math.round(deltaMin / 60);
	if (deltaHr < 24) return `${deltaHr}h ago`;
	const deltaDay = Math.round(deltaHr / 24);
	if (deltaDay < 30) return `${deltaDay}d ago`;
	const deltaMonth = Math.round(deltaDay / 30);
	if (deltaMonth < 12) return `${deltaMonth}mo ago`;
	return `${Math.round(deltaMonth / 12)}y ago`;
}
