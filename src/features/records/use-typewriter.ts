import { useEffect, useRef, useState } from "react";

/**
 * Progressive reveal of `full` text. Returns the substring revealed so far.
 * When `enabled` is false (or text changes to empty) it returns `full` as-is
 * (no animation) so non-generation views render instantly.
 */
export function useTypewriter(
	full: string,
	enabled: boolean,
	charsPerTick = 12,
	tickMs = 24,
): string {
	const [shown, setShown] = useState(enabled ? "" : full);
	const idx = useRef(0);
	useEffect(() => {
		if (!enabled) {
			setShown(full);
			return;
		}
		idx.current = 0;
		setShown("");
		if (!full) return;
		const timer = setInterval(() => {
			idx.current = Math.min(full.length, idx.current + charsPerTick);
			setShown(full.slice(0, idx.current));
			if (idx.current >= full.length) clearInterval(timer);
		}, tickMs);
		return () => clearInterval(timer);
	}, [full, enabled, charsPerTick, tickMs]);
	return shown;
}
