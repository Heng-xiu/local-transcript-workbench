/** Domain-flavoured sentence pools used to synthesise believable transcripts. */
export type CorpusDomain =
	| "meeting"
	| "sales"
	| "interview"
	| "standup"
	| "board"
	| "support"
	| "oneonone";

export const SPEAKER_NAMES: Record<CorpusDomain, readonly string[]> = {
	meeting: ["Maya", "Jordan", "Priya", "Tom", "Lena", "Devon"],
	sales: ["Alex (AE)", "Sam (Acme)", "Riley (Acme)"],
	interview: ["Researcher", "Participant"],
	standup: ["Lead", "Ana", "Ben", "Chen", "Dia"],
	board: ["Chair", "CEO", "CFO", "Director A", "Director B", "Counsel"],
	support: ["Agent", "Customer", "Escalation Eng"],
	oneonone: ["Manager", "Report"],
};

export const SPEAKER_COLORS: readonly string[] = [
	"hsl(221 83% 53%)",
	"hsl(142 71% 45%)",
	"hsl(0 72% 51%)",
	"hsl(38 92% 50%)",
	"hsl(280 65% 60%)",
	"hsl(190 80% 42%)",
];

const FILLERS = [
	"Yeah,",
	"Right,",
	"So",
	"Okay, so",
	"I mean,",
	"Honestly,",
	"To be clear,",
	"Look,",
];

const INTERJECTIONS = [
	"Right.",
	"Exactly.",
	"Mm-hmm.",
	"Makes sense.",
	"Got it.",
	"Agreed.",
	"Sure.",
	"Sounds good.",
];

const SENTENCES: Record<CorpusDomain, readonly string[]> = {
	meeting: [
		"I think the bigger question is whether we ship the redesign this quarter or split it across two releases.",
		"Our activation numbers dipped after the last onboarding change, so we should revisit that flow.",
		"Engineering capacity is the constraint here, not design.",
		"Can we get a rough estimate before we commit to a date in the roadmap?",
		"The support tickets are clustering around the export feature again.",
		"Let's timebox the spike to two days and reconvene.",
		"I'd rather under-promise on scope and actually hit the deadline.",
		"We need a single owner for the migration, otherwise it stalls.",
		"Marketing wants a firm launch window by end of week.",
		"The data pipeline change unblocks three of these items.",
		"Let's park the pricing discussion for a separate session.",
		"If we cut the analytics dashboard, the rest fits in the sprint.",
	],
	sales: [
		"Walk me through how your team handles transcription today.",
		"Right now it's mostly manual, and it takes us hours per week.",
		"What does success look like for you six months from now?",
		"Budget isn't the blocker; getting buy-in from security is.",
		"We'd need this to run fully on-prem, no data leaving our network.",
		"Who else would be involved in the evaluation on your side?",
		"The timeline is tight — we're hoping to roll out by Q3.",
		"How are you measuring the cost of the current process?",
		"We've been burned by tools that promised local but phoned home.",
		"Can you put together a proposal we can take to the CFO?",
		"Let's schedule a technical deep-dive with your infra team.",
		"What would it take to get a pilot started next month?",
	],
	interview: [
		"Tell me about the last time you set up a new project.",
		"Honestly, I got stuck on the very first screen.",
		"I wasn't sure what the difference between a project and a transcript was.",
		"The part that worked well was how fast the list loaded.",
		"I'd expect clicking the timestamp to jump the audio, and it did.",
		"What I really wanted was to fix a name without losing my place.",
		"I almost gave up before I found the export button.",
		"It felt familiar, like other tools I've used.",
		"The confidence score confused me at first.",
		"I'd use this every week if it saved me the copy-paste step.",
		"Can you say more about what 'autosave' means to you?",
		"I assume it saves, but I'd like to see that it actually did.",
	],
	standup: [
		"Yesterday I finished the virtualization spike and opened the PR.",
		"Today I'm picking up the autosave debounce bug.",
		"I'm blocked on the API contract for segment updates.",
		"No blockers, just code review on the export pipeline.",
		"I'll pair with Ana after standup on the speaker colors.",
		"The flaky test is back; I'll quarantine it for now.",
		"Staging deploy is green as of this morning.",
		"I need a review on the docx converter before lunch.",
		"Carrying over the empty-state work from yesterday.",
		"Quick heads up: dependency bump landed, please re-run install.",
	],
	board: [
		"Let's move to the financial review on slide four.",
		"Revenue is up eleven percent quarter over quarter.",
		"The on-prem deployment model is resonating with enterprise buyers.",
		"We should discuss the hiring plan against the new burn rate.",
		"Gross margin improved after we moved inference in-house.",
		"I'd like the committee's view on the proposed option pool.",
		"Cash runway is comfortable through the next fiscal year.",
		"The audit came back clean with two minor recommendations.",
		"We're seeing churn concentrated in the smallest accounts.",
		"Counsel, can you summarise the regulatory exposure here?",
		"Let's table the acquisition conversation for executive session.",
		"Motion to approve the budget as presented — all in favour?",
	],
	support: [
		"I understand this has been frustrating; let me pull up your account.",
		"The export has been failing every time since the update.",
		"Can you confirm which format you're exporting to?",
		"I'm escalating this to engineering with your logs attached.",
		"As a workaround, try exporting the Markdown version for now.",
		"We've reproduced the issue and a fix is in progress.",
		"Your data never left your environment; this was a render bug.",
		"I'll keep this ticket open until you confirm it's resolved.",
		"Thanks for your patience — here's a summary of the next steps.",
		"The root cause was an empty segment breaking the converter.",
	],
	oneonone: [
		"How are you feeling about the workload this sprint?",
		"Honestly a bit stretched, but the new tooling is helping.",
		"What would make the biggest difference for you right now?",
		"I'd love more focus time without context switching.",
		"Let's protect two no-meeting mornings a week.",
		"I want to grow toward owning a whole feature area.",
		"That's reasonable; let's map out what that would take.",
		"Any feedback for me on how the team is being run?",
		"More visibility into the roadmap would help me prioritise.",
		"Let's revisit this in our next one-on-one.",
	],
};

/** Build a single segment's text for the given domain. */
export function buildSegmentText(
	domain: CorpusDomain,
	rand: {
		next(): number;
		int(min: number, max: number): number;
		pick<T>(items: readonly T[]): T;
		chance(probability: number): boolean;
	},
): string {
	if (rand.chance(0.12)) {
		return rand.pick(INTERJECTIONS);
	}
	const pool = SENTENCES[domain];
	const count = rand.chance(0.18) ? rand.int(3, 4) : rand.int(1, 2);
	const parts: string[] = [];
	for (let i = 0; i < count; i++) {
		let sentence = rand.pick(pool);
		if (i === 0 && rand.chance(0.3)) {
			const filler = rand.pick(FILLERS);
			sentence = `${filler} ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
		}
		parts.push(sentence);
	}
	return parts.join(" ");
}
