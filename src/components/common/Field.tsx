import { cn } from "cn";
import type * as React from "react";

import { Label } from "@/components/ui/label";

export function Field({
	label,
	htmlFor,
	error,
	description,
	required,
	className,
	children,
}: {
	label?: string;
	htmlFor?: string;
	error?: string | null;
	description?: string;
	required?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("space-y-2", className)}>
			{label ? (
				<Label htmlFor={htmlFor} className="text-foreground">
					{label}
					{required ? <span className="text-destructive">*</span> : null}
				</Label>
			) : null}
			{children}
			{error ? (
				<p className="text-destructive text-xs font-medium" role="alert">
					{error}
				</p>
			) : description ? (
				<p className="text-muted-foreground text-xs">{description}</p>
			) : null}
		</div>
	);
}
