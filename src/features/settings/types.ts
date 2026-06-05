/**
 * Read-only local/self-hosted integration status surfaced in the Settings
 * section. The MVP never edits credentials or exposes secrets — these types
 * describe placeholder/status cards derived from `VITE_*` configuration.
 */
export type IntegrationKind =
	| "api"
	| "livekit"
	| "llm"
	| "openrouter"
	| "storage"
	| "export";

export type IntegrationStatusState =
	| "placeholder"
	| "configured"
	| "missing"
	| "error";

export interface LocalIntegrationStatus {
	id: string;
	name: string;
	kind: IntegrationKind;
	status: IntegrationStatusState;
	description: string;
	/** The `VITE_*` env vars this integration reads (never their values/secrets). */
	envVars: string[];
	details?: Record<string, string | number | boolean>;
}

/**
 * Storage usage/capacity. **Mock-only in the MVP** — real capacity must come
 * from a backend endpoint (`GET /system/storage`) later.
 */
export interface StorageStatus {
	usedBytes: number;
	totalBytes: number;
	recordingBytes: number;
	transcriptBytes: number;
	exportBytes: number;
}
