/**
 * LiveKit placeholder types.
 *
 * The MVP never opens a real LiveKit connection. These types document the
 * shape the backend's token endpoint is expected to return so that wiring up
 * the real `livekit-client` SDK later is a localised change inside
 * `features/livekit-placeholder`.
 */

export type LiveKitConnectionState =
	| "disconnected"
	| "placeholder"
	| "connecting"
	| "connected"
	| "error";

export interface LiveKitConnectionInfo {
	state: LiveKitConnectionState;
	wsUrl: string | null;
	roomName: string | null;
	/** Short-lived access token minted by the backend. Always null in MVP. */
	token: string | null;
	/** Human-readable explanation shown in the UI. */
	note: string;
}
