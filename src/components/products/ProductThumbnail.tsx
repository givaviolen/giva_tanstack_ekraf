import { ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "cn";

import { initials } from "@/lib/format";

export function ProductThumbnail({
	name,
	image,
	className,
}: {
	name: string;
	image?: string | null;
	className?: string;
}) {
	const [failed, setFailed] = useState(false);

	if (image && !failed) {
		return (
			<img
				src={image}
				alt=""
				loading="lazy"
				onError={() => setFailed(true)}
				className={cn(
					"bg-muted border-border size-11 shrink-0 rounded-xl border object-cover",
					className,
				)}
			/>
		);
	}

	return (
		<span
			aria-hidden
			className={cn(
				"bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl text-sm font-semibold",
				className,
			)}
		>
			{failed ? <ImageOff className="size-4 opacity-70" /> : initials(name)}
		</span>
	);
}
