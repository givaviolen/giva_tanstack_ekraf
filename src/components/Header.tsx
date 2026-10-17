import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import ThemeToggle from "./ThemeToggle";
import { Brand } from "./layout/Brand";

export default function Header() {
	const { data: session, isPending } = authClient.useSession();

	return (
		<header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-lg">
			<div className="page-wrap flex h-16 items-center justify-between gap-4">
				<Brand />

				<div className="flex items-center gap-1.5 sm:gap-2">
					<ThemeToggle />

					{isPending ? (
						<div className="bg-muted h-9 w-24 animate-pulse rounded-lg" />
					) : session?.user ? (
						<Button asChild size="sm" className="rounded-full">
							<Link to="/dashboard">
								<LayoutDashboard className="size-4" />
								Dashboard
							</Link>
						</Button>
					) : (
						<>
							<Button asChild variant="ghost" size="sm" className="rounded-full">
								<Link to="/login">Sign in</Link>
							</Button>
							<Button asChild size="sm" className="rounded-full">
								<Link to="/register">Get started</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
