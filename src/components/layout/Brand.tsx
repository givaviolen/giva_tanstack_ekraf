import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";

import { cn } from "cn";

export function BrandMark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"from-primary to-accent-foreground text-primary-foreground relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-to-br shadow-sm",
				className,
			)}
		>
			<Waves className="relative size-4.5" />
			<span className="bg-destructive absolute inset-x-0 bottom-0 h-[3px]" />
		</span>
	);
}

export function Brand({
	className,
	compact = false,
	to = "/",
}: {
	className?: string;
	compact?: boolean;
	to?: "/" | "/dashboard";
}) {
	return (
		<Link
			to={to}
			className={cn(
				"group text-foreground flex items-center gap-2.5 rounded-lg no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
				className,
			)}
		>
			<BrandMark />
			{!compact ? (
				<span className="flex flex-col leading-none">
					<span className="text-[0.95rem] font-bold tracking-tight">UKM Danau Toba</span>
					<span className="text-muted-foreground mt-0.5 text-[0.66rem] font-medium tracking-wide uppercase">
						Direktori &amp; Dashboard
					</span>
				</span>
			) : null}
		</Link>
	);
}
