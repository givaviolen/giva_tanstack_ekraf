import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const alertVariants = cva(
	"relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-xl border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5",
	{
		variants: {
			variant: {
				default: "bg-card text-card-foreground",
				destructive:
					"border-destructive/25 bg-destructive/8 text-destructive [&>svg]:text-destructive",
				success: "border-success/25 bg-success/8 text-success [&>svg]:text-success",
				warning: "border-warning/30 bg-warning/10 text-warning-foreground dark:text-warning",
				info: "border-primary/20 bg-primary/8 text-primary [&>svg]:text-primary",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn("col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight", className)}
			{...props}
		/>
	);
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn("col-start-2 grid justify-items-start gap-1 text-sm opacity-90", className)}
			{...props}
		/>
	);
}

export { Alert, AlertDescription, AlertTitle };
