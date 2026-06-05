import { useStore } from "@tanstack/react-store";
import { Pause, Play, Radio, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AudioSource } from "@/features/transcripts/types";
import { playbackActions, playbackStore } from "@/lib/stores/playback-store";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils/time";
import { useAudioTransport } from "./use-audio-transport";

const RATES = [0.75, 1, 1.25, 1.5, 2] as const;
const SKIP_SEC = 10;

interface AudioPlayerProps {
	audio: AudioSource;
}

export function AudioPlayer({ audio }: AudioPlayerProps) {
	useAudioTransport(audio);
	const isPlaying = useStore(playbackStore, (s) => s.isPlaying);
	const currentTime = useStore(playbackStore, (s) => s.currentTime);
	const duration = useStore(playbackStore, (s) => s.duration);
	const playbackRate = useStore(playbackStore, (s) => s.playbackRate);
	const isLiveKit = audio.kind === "livekit";

	return (
		<div className="flex flex-col gap-2 border-b bg-card px-4 py-3">
			<div className="flex items-center gap-3">
				<Button
					type="button"
					size="icon"
					variant="default"
					onClick={() => playbackActions.toggle()}
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? (
						<Pause className="size-4" />
					) : (
						<Play className="size-4" />
					)}
				</Button>

				<div className="flex items-center gap-1">
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						onClick={() => playbackActions.seek(currentTime - SKIP_SEC)}
						aria-label={`Back ${SKIP_SEC} seconds`}
					>
						<RotateCcw className="size-4" />
					</Button>
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						onClick={() => playbackActions.seek(currentTime + SKIP_SEC)}
						aria-label={`Forward ${SKIP_SEC} seconds`}
					>
						<RotateCw className="size-4" />
					</Button>
				</div>

				<span className="font-mono text-xs text-muted-foreground tabular-nums">
					{formatClock(currentTime)} / {formatClock(duration)}
				</span>

				<input
					type="range"
					min={0}
					max={Math.max(duration, 0.001)}
					step={0.1}
					value={Math.min(currentTime, duration)}
					onChange={(e) => playbackActions.seek(Number(e.target.value))}
					aria-label="Seek"
					className={cn(
						"h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-secondary",
						"[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
						"[&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
					)}
				/>

				<Select
					value={String(playbackRate)}
					onValueChange={(v) => playbackActions.setRate(Number(v))}
				>
					<SelectTrigger
						size="sm"
						className="w-[74px]"
						aria-label="Playback speed"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{RATES.map((rate) => (
							<SelectItem key={rate} value={String(rate)}>
								{rate}×
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				{isLiveKit ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
								<Radio className="size-3" />
								LiveKit (placeholder)
							</span>
						</TooltipTrigger>
						<TooltipContent>
							Live capture is mocked. The backend will mint a LiveKit token and
							stream audio here.
						</TooltipContent>
					</Tooltip>
				) : (
					<span className="inline-flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-emerald-500" />
						{audio.simulated ? "Simulated recording" : "Local recording"}
					</span>
				)}
				<span className="text-muted-foreground/60">·</span>
				<span>{audio.mimeType ?? "audio"}</span>
			</div>
		</div>
	);
}
