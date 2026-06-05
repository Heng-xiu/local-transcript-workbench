import { AudioWaveform, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectStatusBadge } from "@/components/project-sidebar/ProjectStatusBadge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/types";
import { env } from "@/lib/config/env";
import { formatDuration } from "@/lib/utils/time";

function ThemeToggle() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem("ltw-theme");
		const prefersDark =
			stored === "dark" ||
			(stored === null &&
				window.matchMedia?.("(prefers-color-scheme: dark)").matches);
		setDark(prefersDark);
		document.documentElement.classList.toggle("dark", prefersDark);
	}, []);

	function toggle() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("ltw-theme", next ? "dark" : "light");
	}

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			onClick={toggle}
			aria-label="Toggle theme"
		>
			{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</Button>
	);
}

export function AppHeader({ project }: { project?: Project }) {
	return (
		<header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-4">
			<div className="flex items-center gap-3">
				<span className="flex items-center gap-2 font-semibold">
					<AudioWaveform className="size-5 text-primary" />
					Transcript Workbench
				</span>
				{project ? (
					<>
						<span className="text-muted-foreground/40">/</span>
						<span className="max-w-[28rem] truncate text-sm">
							{project.name}
						</span>
						<ProjectStatusBadge status={project.status} />
						<span className="text-xs text-muted-foreground tabular-nums">
							{formatDuration(project.durationSec)}
						</span>
					</>
				) : null}
			</div>
			<div className="flex items-center gap-2">
				<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
					{env.useMockApi ? "Mock data" : "Live API"}
				</span>
				<ThemeToggle />
			</div>
		</header>
	);
}
