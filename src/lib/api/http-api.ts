/**
 * HTTP adapter for the self-hosted backend.
 *
 * This is the seam where the real backend plugs in. It implements the exact
 * same {@link WorkbenchApi} interface as the mock adapter using `fetch` against
 * `VITE_API_BASE_URL`. It is selected automatically once that env var is set
 * (see `lib/api/index.ts`). Endpoints are RESTful guesses the backend team can
 * adjust in one place; streaming generation can later be upgraded to SSE/fetch
 * streaming inside `generateOutput` without touching any UI code.
 */
import type { GeneratedOutput } from "@/features/ai/types";
import type { ExportRequest, ExportResult } from "@/features/export/types";
import type { LiveKitConnectionInfo } from "@/features/livekit-placeholder/types";
import type { Project } from "@/features/projects/types";
import type { TranscriptSegment } from "@/features/segments/types";
import type { AudioSource, Transcript } from "@/features/transcripts/types";
import { env } from "@/lib/config/env";
import type {
	GenerateOptions,
	GenerateOutputInput,
	UpdateSegmentInput,
	WorkbenchApi,
} from "./types";

async function request<T>(
	path: string,
	init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
	const res = await fetch(`${env.apiBaseUrl}${path}`, {
		headers: { "content-type": "application/json", ...init?.headers },
		...init,
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} for ${path}: ${await res.text()}`);
	}
	return (await res.json()) as T;
}

export const httpApi: WorkbenchApi = {
	listProjects() {
		return request<Project[]>("/projects");
	},
	getProject(projectId) {
		return request<Project>(`/projects/${encodeURIComponent(projectId)}`);
	},
	getTranscript(transcriptId) {
		return request<Transcript>(
			`/transcripts/${encodeURIComponent(transcriptId)}`,
		);
	},
	getAudioSource(transcriptId) {
		return request<AudioSource>(
			`/transcripts/${encodeURIComponent(transcriptId)}/audio`,
		);
	},
	listSegments(transcriptId) {
		return request<TranscriptSegment[]>(
			`/transcripts/${encodeURIComponent(transcriptId)}/segments`,
		);
	},
	updateSegment(input: UpdateSegmentInput) {
		return request<TranscriptSegment>(
			`/transcripts/${encodeURIComponent(input.transcriptId)}/segments/${encodeURIComponent(input.segmentId)}`,
			{
				method: "PATCH",
				body: JSON.stringify({
					text: input.text,
					baseRevision: input.baseRevision,
				}),
			},
		);
	},
	listTemplates() {
		return request("/templates");
	},
	async generateOutput(
		input: GenerateOutputInput,
		options: GenerateOptions = {},
	) {
		// MVP backend is non-streaming; emit the whole document once. Upgrade to
		// SSE/streamed fetch here later without changing callers.
		const output = await request<GeneratedOutput>("/ai/generate", {
			method: "POST",
			body: JSON.stringify(input),
			signal: options.signal,
		});
		options.onToken?.(output.markdown, output.markdown);
		return output;
	},
	async exportOutput(req: ExportRequest): Promise<ExportResult> {
		const res = await fetch(`${env.apiBaseUrl}/export`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(req),
		});
		if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
		const blob = await res.blob();
		const extension = req.format === "docx" ? "docx" : "md";
		return {
			format: req.format,
			filename: `${req.filename}.${extension}`,
			mimeType: blob.type,
			blob,
		};
	},
	getLiveKitConnection(projectId) {
		return request<LiveKitConnectionInfo>(
			`/projects/${encodeURIComponent(projectId)}/livekit`,
		);
	},
};
