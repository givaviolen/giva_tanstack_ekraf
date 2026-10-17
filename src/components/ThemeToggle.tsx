import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeMode = "light" | "dark" | "auto";

const MODE_LABEL: Record<ThemeMode, string> = {
	light: "Light",
	dark: "Dark",
	auto: "System",
};

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") return "auto";
	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "auto") return stored;
	return "auto";
}

function applyThemeMode(mode: ThemeMode) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;

	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);

	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}

	document.documentElement.style.colorScheme = resolved;
}

export default function ThemeToggle({ className }: { className?: string }) {
	const [mode, setMode] = useState<ThemeMode>("auto");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mode !== "auto") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyThemeMode("auto");
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [mode]);

	function selectMode(next: ThemeMode) {
		setMode(next);
		applyThemeMode(next);
		try {
			window.localStorage.setItem("theme", next);
		} catch {
			// localStorage may be unavailable (private mode); theme still applies for the session.
		}
	}

	const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={`Theme: ${MODE_LABEL[mode]}. Change theme`}
					className={cn(
						"text-muted-foreground hover:text-foreground rounded-full",
						!mounted && "opacity-0",
						className,
					)}
				>
					<Icon className="size-4.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				{(["light", "dark", "auto"] as ThemeMode[]).map((option) => {
					const OptionIcon = option === "light" ? Sun : option === "dark" ? Moon : Monitor;
					return (
						<DropdownMenuItem
							key={option}
							onClick={() => selectMode(option)}
							className={cn(
								"justify-between",
								mode === option && "bg-accent text-accent-foreground",
							)}
						>
							<span className="flex items-center gap-2">
								<OptionIcon className="size-4" />
								{MODE_LABEL[option]}
							</span>
							{mode === option ? (
								<span className="text-primary text-xs font-semibold">•</span>
							) : null}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
