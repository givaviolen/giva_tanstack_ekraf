import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import type * as React from "react";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-[0.99]",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 hover:bg-destructive/90 focus-visible:ring-destructive/25 active:scale-[0.99]",
				outline:
					"border bg-card shadow-xs hover:bg-accent hover:text-accent-foreground active:scale-[0.99]",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				success:
					"bg-success text-success-foreground shadow-sm shadow-success/20 hover:bg-success/90 active:scale-[0.99]",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
				sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
				lg: "h-11 rounded-xl px-6 has-[>svg]:px-5",
				icon: "size-9",
				"icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
