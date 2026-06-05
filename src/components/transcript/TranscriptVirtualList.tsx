import { useStore } from "@tanstack/react-store";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { findActiveSegmentIndex } from "@/features/segments/active-segment";
import type { TranscriptSegment } from "@/features/segments/types";
import type { Speaker } from "@/features/transcripts/types";
import { playbackActions, playbackStore } from "@/lib/stores/playback-store";
import { TranscriptSegmentRow } from "./TranscriptSegmentRow";

interface TranscriptVirtualListProps {
	segments: TranscriptSegment[];
	speakers: Speaker[];
	transcriptId: string;
}

/**
 * Virtualized, variable-height transcript list. Only the visible window of rows
 * is mounted, so it scales to thousands of segments. Row heights are measured
 * dynamically (`measureElement`) because editable text wraps to varying heights.
 */
export function TranscriptVirtualList({
	segments,
	speakers,
	transcriptId,
}: TranscriptVirtualListProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const speakerById = useMemo(
		() => new Map(speakers.map((s) => [s.id, s])),
		[speakers],
	);

	// Re-renders only when the active *index* changes, not on every clock tick.
	const activeIndex = useStore(playbackStore, (s) =>
		findActiveSegmentIndex(segments, s.currentTime),
	);

	const onSeek = useCallback((timeSec: number) => {
		playbackActions.seek(timeSec);
		playbackActions.play();
	}, []);

	const virtualizer = useVirtualizer({
		count: segments.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 84,
		overscan: 8,
		getItemKey: (index) => segments[index].id,
	});

	// Follow the playhead while playing: keep the active row in view.
	useEffect(() => {
		if (activeIndex < 0 || !playbackStore.state.isPlaying) return;
		virtualizer.scrollToIndex(activeIndex, { align: "center" });
	}, [activeIndex, virtualizer]);

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<div
			ref={parentRef}
			className="h-full overflow-auto"
			data-testid="transcript-scroll"
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					position: "relative",
					width: "100%",
				}}
			>
				{virtualItems.map((item) => {
					const segment = segments[item.index];
					return (
						<div
							key={item.key}
							data-index={item.index}
							ref={virtualizer.measureElement}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${item.start}px)`,
							}}
						>
							<TranscriptSegmentRow
								segment={segment}
								speaker={speakerById.get(segment.speakerId)}
								transcriptId={transcriptId}
								isActive={item.index === activeIndex}
								onSeek={onSeek}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
