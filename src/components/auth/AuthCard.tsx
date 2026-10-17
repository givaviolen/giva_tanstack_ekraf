import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function AuthCard({
	icon: Icon,
	title,
	description,
	children,
	footer,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<Card className="border-border/70 shadow-xl shadow-primary/5">
			<CardHeader className="items-center gap-3 text-center">
				<span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
					<Icon className="size-6" />
				</span>
				<div className="space-y-1.5">
					<CardTitle className="text-2xl">{title}</CardTitle>
					<CardDescription className="mx-auto max-w-sm text-balance">{description}</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">{children}</CardContent>
			{footer ? <CardFooter className="justify-center pt-2">{footer}</CardFooter> : null}
		</Card>
	);
}
