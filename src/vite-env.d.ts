/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL of the self-hosted workbench backend (empty => use mock API). */
	readonly VITE_API_BASE_URL?: string;
	/**
	 * Base URL of the meeting-api transcript service, including the `/api`
	 * prefix (empty => transcript reads use the mock API).
	 */
	readonly VITE_MEETING_API_BASE_URL?: string;
	/** WebSocket URL of the local LiveKit server (placeholder in MVP). */
	readonly VITE_LIVEKIT_WS_URL?: string;
	/** Backend endpoint that mints short-lived LiveKit access tokens. */
	readonly VITE_LIVEKIT_TOKEN_ENDPOINT?: string;
	/** Which AI provider the backend should route generation jobs to. */
	readonly VITE_AI_PROVIDER_MODE?: "local" | "openrouter";
	/** Backend endpoint that runs LLM generation jobs. */
	readonly VITE_AI_GENERATION_ENDPOINT?: string;
	/** Backend endpoint that streams recording audio assets. */
	readonly VITE_RECORDING_ASSET_ENDPOINT?: string;
	/** Sentry/GlitchTip DSN. Empty => error reporting disabled. */
	readonly VITE_SENTRY_DSN?: string;
	/** Sentry environment tag, e.g. development | production. */
	readonly VITE_SENTRY_ENVIRONMENT?: string;
	/** Sentry traces sample rate, 0..1. */
	readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
