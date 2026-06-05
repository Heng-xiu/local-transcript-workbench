/**
 * The "mock LLM". Produces grounded, believable Markdown for each template
 * using the real project/transcript/segment data so the output reflects what
 * you see in the editor. The future backend replaces this entirely; the
 * frontend only consumes the returned Markdown string.
 *
 * Lives in `lib/mock-data` (the mock backend), not `features`, so the `lib`
 * layer never imports runtime values from `features`.
 */
import type { OutputTemplateId } from "@/features/ai/types";
import type { Project } from "@/features/projects/types";
import type { TranscriptSegment } from "@/features/segments/types";
import type { Transcript } from "@/features/transcripts/types";
import { formatClock, formatDuration } from "@/lib/utils/time";

export interface GenerationContext {
	project: Project;
	transcript: Transcript;
	segments: TranscriptSegment[];
}

function speakerLabel(ctx: GenerationContext, speakerId: string): string {
	return (
		ctx.transcript.speakers.find((s) => s.id === speakerId)?.label ?? "Speaker"
	);
}

/** Deterministically pick the N longest, most "substantive" segments. */
function salientSegments(
	ctx: GenerationContext,
	count: number,
): TranscriptSegment[] {
	return [...ctx.segments]
		.filter((s) => s.text.length > 50)
		.sort((a, b) => b.text.length - a.text.length || a.index - b.index)
		.slice(0, count)
		.sort((a, b) => a.index - b.index);
}

function participantsLine(ctx: GenerationContext): string {
	return ctx.transcript.speakers.map((s) => s.label).join(", ");
}

function meetingSummary(ctx: GenerationContext): string {
	const points = salientSegments(ctx, 6);
	const decisions = salientSegments(ctx, 9).slice(6, 9);
	return [
		`# Meeting Summary — ${ctx.project.name}`,
		"",
		"## Overview",
		"",
		`This ${formatDuration(ctx.project.durationSec)} session covered the team's near-term priorities and trade-offs. Participants: ${participantsLine(ctx)}.`,
		"",
		"## Key Discussion Points",
		"",
		...points.map((s) => `- **${speakerLabel(ctx, s.speakerId)}** — ${s.text}`),
		"",
		"## Decisions",
		"",
		...decisions.map((s) => `- ${s.text}`),
		"",
		"## Next Steps",
		"",
		"- Circulate these notes to all participants.",
		"- Confirm owners and target dates for each decision above.",
		"- Revisit open questions at the next sync.",
		"",
	].join("\n");
}

function actionItems(ctx: GenerationContext): string {
	const candidates = salientSegments(ctx, 8);
	const dues = ["EOD", "this week", "next sprint", "by Friday", "TBD"];
	const rows = candidates.map((s, i) => {
		const owner = speakerLabel(ctx, s.speakerId);
		const due = dues[i % dues.length];
		return `- [ ] **${owner}** — ${s.text} _(due: ${due})_`;
	});
	return [
		`# Action Items — ${ctx.project.name}`,
		"",
		`Extracted ${rows.length} commitments from a ${formatDuration(ctx.project.durationSec)} recording.`,
		"",
		"## Checklist",
		"",
		...rows,
		"",
		"## Owners",
		"",
		...ctx.transcript.speakers.map((sp) => `- **${sp.label}**`),
		"",
	].join("\n");
}

function salesCallNotes(ctx: GenerationContext): string {
	const pains = salientSegments(ctx, 4);
	const objections = salientSegments(ctx, 7).slice(4, 7);
	return [
		`# Sales Call Notes — ${ctx.project.name}`,
		"",
		"## Prospect",
		"",
		`- **Account:** ${ctx.project.name.replace(/\s*—.*$/, "")}`,
		`- **Attendees:** ${participantsLine(ctx)}`,
		`- **Call length:** ${formatDuration(ctx.project.durationSec)}`,
		"",
		"## Pain Points",
		"",
		...pains.map((s) => `- ${s.text}`),
		"",
		"## BANT",
		"",
		"| Dimension | Signal |",
		"| --- | --- |",
		"| Budget | Not a blocker; CFO sign-off required |",
		"| Authority | Multiple stakeholders in evaluation |",
		"| Need | On-prem, no data egress |",
		"| Timeline | Targeting next quarter |",
		"",
		"## Objections",
		"",
		...objections.map((s) => `- ${s.text}`),
		"",
		"## Next Steps",
		"",
		"- Send a written proposal for CFO review.",
		"- Schedule a technical deep-dive with the infra team.",
		"- Define success criteria for a pilot.",
		"",
	].join("\n");
}

function interviewNotes(ctx: GenerationContext): string {
	const quotes = salientSegments(ctx, 4);
	const insights = salientSegments(ctx, 8).slice(4, 8);
	return [
		`# Interview Notes — ${ctx.project.name}`,
		"",
		`**Participants:** ${participantsLine(ctx)} · **Duration:** ${formatDuration(ctx.project.durationSec)}`,
		"",
		"## Themes",
		"",
		"- Onboarding clarity and first-run expectations.",
		"- Trust in autosave and data persistence.",
		"- Speed and familiarity of the core workflow.",
		"",
		"## Notable Quotes",
		"",
		...quotes.flatMap((s) => [
			`> ${s.text}`,
			`> — ${speakerLabel(ctx, s.speakerId)}, ${formatClock(s.startSec)}`,
			"",
		]),
		"## Insights",
		"",
		...insights.map((s) => `- ${s.text}`),
		"",
		"## Follow-ups",
		"",
		"- Test a revised first-run flow with 3 more participants.",
		"- Add an explicit 'saved' confirmation to the editor.",
		"",
	].join("\n");
}

const GENERATORS: Record<OutputTemplateId, (ctx: GenerationContext) => string> =
	{
		"meeting-summary": meetingSummary,
		"action-items": actionItems,
		"sales-call-notes": salesCallNotes,
		"interview-notes": interviewNotes,
	};

export function buildMockMarkdown(
	templateId: OutputTemplateId,
	ctx: GenerationContext,
): string {
	return GENERATORS[templateId](ctx);
}
