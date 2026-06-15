import type {
	MeetingRecord,
	MeetingRecordStatus,
	MeetingRecordVersion,
} from "@/features/records/types";
import { env } from "@/lib/config/env";
import type { WorkbenchApi } from "./types";

interface RecordVersionDto {
	id: string;
	version: number;
	templateId: string;
	model: string;
	createdAt: string;
	promptTokens: number | null;
	completionTokens: number | null;
}
interface RecordSummaryDto {
	id: string;
	meetingId: string;
	transcriptId: string;
	templateId: string;
	title: string;
	status: "generating" | "ready" | "failed";
	latestVersion: number;
	failureReason: string | null;
	updatedAt: string;
	versions: RecordVersionDto[];
}
interface VersionContentDto {
	version: number;
	templateId: string;
	model: string;
	createdAt: string;
	markdown: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const url = `${env.meetingApiBaseUrl}${path}`;
	const res = init
		? await fetch(url, {
				...init,
				headers: { "content-type": "application/json", ...init.headers },
			})
		: await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
	return (await res.json()) as T;
}

function toVersion(v: RecordVersionDto): MeetingRecordVersion {
	return {
		id: v.id,
		version: v.version,
		templateId: v.templateId,
		model: v.model,
		createdAt: v.createdAt,
		promptTokens: v.promptTokens,
		completionTokens: v.completionTokens,
	};
}

function toRecord(dto: RecordSummaryDto, markdown?: string): MeetingRecord {
	return {
		id: dto.id,
		meetingId: dto.meetingId,
		transcriptId: dto.transcriptId,
		title: dto.title,
		templateId: dto.templateId,
		status: dto.status as MeetingRecordStatus,
		markdown,
		updatedAt: dto.updatedAt,
		versions: dto.versions.map(toVersion),
		latestVersion: dto.latestVersion,
	};
}

export const meetingApiRecords = {
	async generateMeetingRecord(
		transcriptId: string,
		templateId: string,
	): Promise<MeetingRecord> {
		const summary = await request<RecordSummaryDto>(
			`/transcripts/${encodeURIComponent(transcriptId)}/records`,
			{ method: "POST", body: JSON.stringify({ templateId }) },
		);
		let markdown: string | undefined;
		if (summary.status === "ready" && summary.latestVersion > 0) {
			const content = await request<VersionContentDto>(
				`/records/${encodeURIComponent(summary.id)}/versions/${summary.latestVersion}`,
			);
			markdown = content.markdown;
		}
		return toRecord(summary, markdown);
	},
} satisfies Pick<WorkbenchApi, "generateMeetingRecord">;

/** 取某一版本的 Markdown（版本切換時用）。非 WorkbenchApi port 方法。 */
export async function fetchRecordVersionMarkdown(
	recordId: string,
	version: number,
): Promise<string> {
	const content = await request<VersionContentDto>(
		`/records/${encodeURIComponent(recordId)}/versions/${version}`,
	);
	return content.markdown;
}
