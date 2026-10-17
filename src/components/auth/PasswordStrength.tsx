import { cn } from "cn";

const LEVELS = [
	{ label: "Too short", bar: "bg-muted-foreground/40", text: "text-muted-foreground" },
	{ label: "Weak", bar: "bg-destructive", text: "text-destructive" },
	{ label: "Fair", bar: "bg-warning", text: "text-warning-foreground" },
	{ label: "Good", bar: "bg-primary", text: "text-primary" },
	{ label: "Strong", bar: "bg-success", text: "text-success" },
] as const;

export function scorePassword(password: string) {
	let score = 0;
	if (password.length >= 8) score += 1;
	if (password.length >= 12) score += 1;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
	if (/\d/.test(password)) score += 1;
	if (/[^A-Za-z0-9]/.test(password)) score += 1;
	return Math.min(score, 4);
}

export function PasswordStrength({ password }: { password: string }) {
	const score = password ? scorePassword(password) : 0;
	const level = LEVELS[score];

	return (
		<div className="space-y-1.5">
			<div className="flex gap-1.5" aria-hidden>
				{Array.from({ length: 4 }).map((_, index) => (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length strength bars
						key={`strength-segment-${index}`}
						className={cn(
							"h-1.5 flex-1 rounded-full transition-colors",
							index < score ? level.bar : "bg-muted",
						)}
					/>
				))}
			</div>
			<p className={cn("text-xs font-medium", password ? level.text : "text-muted-foreground")}>
				{password
					? `Password strength: ${level.label}`
					: "Use 8+ characters with a mix of letters, numbers & symbols"}
			</p>
		</div>
	);
}
