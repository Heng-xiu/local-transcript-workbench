import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library does not auto-clean up with Vitest; do it ourselves so
// each test starts from a fresh DOM.
afterEach(() => {
	cleanup();
});

// --- jsdom polyfills for browser APIs the component tree touches ---

// TanStack Virtual measures rows with ResizeObserver.
if (!("ResizeObserver" in globalThis)) {
	class ResizeObserverStub {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	globalThis.ResizeObserver =
		ResizeObserverStub as unknown as typeof ResizeObserver;
}

// The theme toggle reads prefers-color-scheme.
if (!window.matchMedia) {
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener() {},
		removeListener() {},
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent() {
			return false;
		},
	})) as unknown as typeof window.matchMedia;
}

// The virtual list follows the playhead via scrollIntoView/scrollToIndex.
if (!Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = () => {};
}

// Blob downloads (export) go through URL.createObjectURL, unimplemented in jsdom.
if (!URL.createObjectURL) {
	URL.createObjectURL = (() => "blob:mock") as typeof URL.createObjectURL;
}
if (!URL.revokeObjectURL) {
	URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
}
