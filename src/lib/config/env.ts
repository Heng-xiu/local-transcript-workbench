/**
 * Centralised, typed access to runtime configuration.
 *
 * Every environment variable the frontend reads is funnelled through this
 * module so that wiring up the real self-hosted backend later is a single-file
 * change. Components and features never touch `import.meta.env` directly.
 *
 * All values are optional with safe defaults so the prototype runs with zero
 * configuration against the in-browser mock API.
 */

export type AIProviderMode = "local" | "openrouter";

function str(value: string | undefined, fallback = ""): string {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

const apiBaseUrl = str(import.meta.env.VITE_API_BASE_URL);

export const env = {
	/** Base URL of the self-hosted backend. Empty string => mock mode. */
	apiBaseUrl,
	/** LiveKit signalling websocket (placeholder; never connected in MVP). */
	livekitWsUrl: str(import.meta.env.VITE_LIVEKIT_WS_URL),
	/** Endpoint that mints LiveKit tokens (placeholder; never called in MVP). */
	livekitTokenEndpoint: str(import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT),
	/** Provider the backend routes generation through. Frontend only displays it. */
	aiProviderMode: (str(import.meta.env.VITE_AI_PROVIDER_MODE, "local") ===
	"openrouter"
		? "openrouter"
		: "local") satisfies AIProviderMode as AIProviderMode,
	/**
	 * Reserved standalone endpoints. The HTTP adapter currently derives all
	 * paths from `apiBaseUrl` (see `lib/api/http-api.ts`); these are kept so the
	 * backend can override individual endpoints (e.g. a separate generation host)
	 * without changing the adapter contract. Not read while mocking.
	 */
	aiGenerationEndpoint: str(import.meta.env.VITE_AI_GENERATION_ENDPOINT),
	recordingAssetEndpoint: str(import.meta.env.VITE_RECORDING_ASSET_ENDPOINT),
	/**
	 * When no backend base URL is configured we serve everything from the
	 * in-browser mock API. Flip this by setting `VITE_API_BASE_URL`.
	 */
	get useMockApi(): boolean {
		return apiBaseUrl.length === 0;
	},
} as const;

export type Env = typeof env;
