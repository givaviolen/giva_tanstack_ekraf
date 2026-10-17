import { Link } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";

import { cn } from "cn";

export function BrandMark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"from-primary to-violet-500 text-primary-foreground grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br shadow-sm",
				className,
			)}
		>
			<Layers3 className="size-4.5" />
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
				"group text-foreground flex items-center gap-2.5 rounded-lg no-underline outline-none",
				className,
			)}
		>
			<BrandMark />
			{!compact ? (
				<span className="flex flex-col leading-none">
					<span className="text-[0.95rem] font-bold tracking-tight">
						Ekraf<span className="text-primary">.</span>
					</span>
					<span className="text-muted-foreground mt-0.5 text-[0.68rem] font-medium tracking-wide uppercase">
						Dashboard
					</span>
				</span>
			) : null}
		</Link>
	);
}
