import { cn } from "cn";
import { Avatar as AvatarPrimitive } from "radix-ui";
import type * as React from "react";

function Avatar({
	className,
	size = "default",
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
	size?: "sm" | "default" | "lg";
}) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			data-size={size}
			className={cn(
				"group/avatar relative flex shrink-0 overflow-hidden rounded-full data-[size=default]:size-9 data-[size=sm]:size-7 data-[size=lg]:size-11",
				className,
			)}
			{...props}
		/>
	);
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn("aspect-square size-full object-cover", className)}
			{...props}
		/>
	);
}

function AvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"bg-primary/12 text-primary flex size-full items-center justify-center rounded-full text-xs font-semibold",
				className,
			)}
			{...props}
		/>
	);
}

export { Avatar, AvatarFallback, AvatarImage };
