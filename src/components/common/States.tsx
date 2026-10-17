import { cn } from "cn";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({
	rows = 4,
	label = "Loading…",
}: {
	rows?: number;
	label?: string;
}) {
	return (
		/* biome-ignore lint/a11y/useSemanticElements: status region is appropriate as div */
		<div className="space-y-3" role="status" aria-live="polite">
			<span className="sr-only">{label}</span>
			{Array.from({ length: rows }).map((_, row) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count
				<div key={`skeleton-row-${row}`} className="flex items-center gap-4">
					<Skeleton className="size-10 shrink-0 rounded-xl" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3.5 w-1/3" />
						<Skeleton className="h-3 w-2/3" />
					</div>
				</div>
			))}
		</div>
	);
}

export function EmptyState({
	icon: Icon = Inbox,
	title,
	description,
	action,
	className,
}: {
	icon?: React.ComponentType<{ className?: string }>;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
				className,
			)}
		>
			<span className="bg-muted text-muted-foreground grid size-11 place-items-center rounded-full">
				<Icon className="size-5" />
			</span>
			<div className="space-y-1">
				<p className="text-foreground text-sm font-semibold">{title}</p>
				{description ? (
					<p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
				) : null}
			</div>
			{action}
		</div>
	);
}

export function ErrorState({
	title = "Something went wrong",
	description,
	onRetry,
	className,
}: {
	title?: string;
	description?: string;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<div
			role="alert"
			className={cn(
				"border-destructive/25 bg-destructive/5 flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-10 text-center",
				className,
			)}
		>
			<span className="bg-destructive/12 text-destructive grid size-11 place-items-center rounded-full">
				<AlertTriangle className="size-5" />
			</span>
			<div className="space-y-1">
				<p className="text-foreground text-sm font-semibold">{title}</p>
				{description ? (
					<p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
				) : null}
			</div>
			{onRetry ? (
				<Button variant="outline" size="sm" onClick={onRetry}>
					<RefreshCw className="size-4" />
					Try again
				</Button>
			) : null}
		</div>
	);
}
