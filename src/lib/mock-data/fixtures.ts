import type { Project, ProjectStatus } from "@/features/projects/types";
import type { TranscriptSegment } from "@/features/segments/types";
import type { Speaker, Transcript } from "@/features/transcripts/types";
import {
	buildSegmentText,
	type CorpusDomain,
	SPEAKER_COLORS,
	SPEAKER_NAMES,
} from "./corpus";
import { createPrng } from "./prng";

/** Fixed reference time so generated timestamps are deterministic. */
const BASE_TIME = Date.parse("2026-06-04T09:00:00.000Z");
const HOUR = 60 * 60 * 1000;

interface ProjectSpec {
	slug: string;
	name: string;
	status: ProjectStatus;
	domain: CorpusDomain;
	speakerCount: number;
	segmentTarget: number;
	/** How long ago the project was last updated, in hours. */
	updatedHoursAgo: number;
}

/**
 * Eight projects spanning every status. The "board" project intentionally has
 * ~1,200 segments to exercise virtualization with thousands of rows.
 */
const PROJECT_SPECS: readonly ProjectSpec[] = [
	{
		slug: "q3-strategy",
		name: "Q3 Product Strategy Sync",
		status: "ready",
		domain: "meeting",
		speakerCount: 4,
		segmentTarget: 420,
		updatedHoursAgo: 3,
	},
	{
		slug: "acme-discovery",
		name: "Acme Corp — Discovery Call",
		status: "ready",
		domain: "sales",
		speakerCount: 3,
		segmentTarget: 260,
		updatedHoursAgo: 9,
	},
	{
		slug: "onboarding-interview",
		name: "User Interview — Onboarding Friction",
		status: "ready",
		domain: "interview",
		speakerCount: 2,
		segmentTarget: 300,
		updatedHoursAgo: 26,
	},
	{
		slug: "eng-standup",
		name: "Engineering Weekly Standup",
		status: "processing",
		domain: "standup",
		speakerCount: 5,
		segmentTarget: 150,
		updatedHoursAgo: 1,
	},
	{
		slug: "fy26-board",
		name: "Board Meeting — FY26 Budget",
		status: "ready",
		domain: "board",
		speakerCount: 6,
		segmentTarget: 1200,
		updatedHoursAgo: 52,
	},
	{
		slug: "sprint-retro",
		name: "Sprint 24 Retrospective",
		status: "archived",
		domain: "meeting",
		speakerCount: 4,
		segmentTarget: 220,
		updatedHoursAgo: 240,
	},
	{
		slug: "weekly-1on1",
		name: "Live Capture — Weekly 1:1",
		status: "recording",
		domain: "oneonone",
		speakerCount: 2,
		segmentTarget: 70,
		updatedHoursAgo: 0,
	},
	{
		slug: "podcast-ep12",
		name: "Podcast Ep. 12 — Raw Cut",
		status: "error",
		domain: "interview",
		speakerCount: 2,
		segmentTarget: 90,
		updatedHoursAgo: 120,
	},
];

export interface MockDataset {
	projects: Project[];
	projectById: Map<string, Project>;
	transcriptById: Map<string, Transcript>;
	segmentsByTranscript: Map<string, TranscriptSegment[]>;
}

function buildSpeakers(spec: ProjectSpec): Speaker[] {
	const names = SPEAKER_NAMES[spec.domain];
	const speakers: Speaker[] = [];
	for (let i = 0; i < spec.speakerCount; i++) {
		speakers.push({
			id: `${spec.slug}_spk_${i}`,
			label: names[i % names.length],
			color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
		});
	}
	return speakers;
}

function buildDataset(seed = 0xc0ffee): MockDataset {
	const projects: Project[] = [];
	const projectById = new Map<string, Project>();
	const transcriptById = new Map<string, Transcript>();
	const segmentsByTranscript = new Map<string, TranscriptSegment[]>();

	PROJECT_SPECS.forEach((spec, specIndex) => {
		const rand = createPrng(seed + specIndex * 7919);
		const projectId = `proj_${spec.slug}`;
		const transcriptId = `tr_${spec.slug}`;
		const speakers = buildSpeakers(spec);

		const segments: TranscriptSegment[] = [];
		const segmentIds: string[] = [];
		let cursor = 0;
		let speakerIdx = 0;
		let runRemaining = rand.int(1, 4);

		for (let i = 0; i < spec.segmentTarget; i++) {
			if (rand.chance(0.25)) {
				cursor += rand.float(0.2, 1.4); // natural pause between turns
			}
			const duration = rand.float(2.2, 11.5);
			const startSec = Math.round(cursor * 100) / 100;
			const endSec = Math.round((cursor + duration) * 100) / 100;
			cursor = endSec;

			if (runRemaining <= 0) {
				let nextIdx = rand.int(0, speakers.length - 1);
				if (speakers.length > 1 && nextIdx === speakerIdx) {
					nextIdx = (nextIdx + 1) % speakers.length;
				}
				speakerIdx = nextIdx;
				runRemaining = rand.int(1, 4);
			}
			runRemaining -= 1;

			const segmentId = `${transcriptId}_seg_${String(i).padStart(4, "0")}`;
			const updatedAt = new Date(
				BASE_TIME - spec.updatedHoursAgo * HOUR + i * 1000,
			).toISOString();
			segments.push({
				id: segmentId,
				transcriptId,
				index: i,
				speakerId: speakers[speakerIdx].id,
				startSec,
				endSec,
				text: buildSegmentText(spec.domain, rand),
				confidence: rand.chance(0.88)
					? Math.round(rand.float(0.78, 0.99) * 100) / 100
					: Math.round(rand.float(0.55, 0.78) * 100) / 100,
				revision: 1,
				updatedAt,
			});
			segmentIds.push(segmentId);
		}

		const durationSec = Math.ceil(cursor);
		const updatedAt = new Date(
			BASE_TIME - spec.updatedHoursAgo * HOUR,
		).toISOString();
		const createdAt = new Date(
			BASE_TIME - spec.updatedHoursAgo * HOUR - durationSec * 1000,
		).toISOString();

		const transcript: Transcript = {
			id: transcriptId,
			projectId,
			language: "en",
			audio: {
				kind: spec.status === "recording" ? "livekit" : "recording",
				url: null,
				durationSec,
				mimeType: "audio/wav",
				simulated: true,
				livekit:
					spec.status === "recording"
						? {
								wsUrl: null,
								roomName: `${spec.slug}-room`,
								tokenEndpoint: null,
							}
						: undefined,
			},
			speakers,
			segmentIds,
			createdAt,
			updatedAt,
			revision: 1,
		};

		const project: Project = {
			id: projectId,
			name: spec.name,
			status: spec.status,
			createdAt,
			updatedAt,
			durationSec,
			language: "en",
			speakerCount: speakers.length,
			segmentCount: segments.length,
			transcriptId,
		};

		projects.push(project);
		projectById.set(projectId, project);
		transcriptById.set(transcriptId, transcript);
		segmentsByTranscript.set(transcriptId, segments);
	});

	return { projects, projectById, transcriptById, segmentsByTranscript };
}

/** Module-singleton dataset — built once, deterministic across reloads. */
export const mockDataset: MockDataset = buildDataset();
