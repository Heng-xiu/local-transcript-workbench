/**
 * Tiny deterministic PRNG (mulberry32) so the generated mock dataset is stable
 * across reloads — important for a believable demo and for snapshot tests.
 */
export function createPrng(seed: number) {
	let state = seed >>> 0;
	function next(): number {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}
	return {
		/** Float in [0, 1). */
		next,
		/** Integer in [min, max] inclusive. */
		int(min: number, max: number): number {
			return min + Math.floor(next() * (max - min + 1));
		},
		/** Float in [min, max). */
		float(min: number, max: number): number {
			return min + next() * (max - min);
		},
		/** Pick a random element. */
		pick<T>(items: readonly T[]): T {
			return items[Math.floor(next() * items.length)];
		},
		/** True with the given probability. */
		chance(probability: number): boolean {
			return next() < probability;
		},
	};
}

export type Prng = ReturnType<typeof createPrng>;
