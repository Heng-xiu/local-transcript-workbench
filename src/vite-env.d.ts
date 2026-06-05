/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL of the self-hosted workbench backend (empty => use mock API). */
	readonly VITE_API_BASE_URL?: string;
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
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
