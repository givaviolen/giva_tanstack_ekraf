import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import ThemeToggle from "./ThemeToggle";
import { Brand } from "./layout/Brand";

const NAV_LINKS = [
	{ to: "/" as const, label: "Beranda" },
	{ to: "/produk" as const, label: "Direktori Produk" },
];

export default function Header() {
	const { data: session, isPending } = authClient.useSession();

	return (
		<header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-lg">
			<div className="page-wrap flex h-16 items-center justify-between gap-4">
				<div className="flex items-center gap-6">
					<Brand />
					<nav className="hidden items-center gap-1 md:flex">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.to}
								to={link.to}
								activeProps={{ className: "text-foreground bg-accent/70" }}
								inactiveProps={{ className: "text-muted-foreground" }}
								className="hover:text-foreground hover:bg-accent/60 rounded-full px-3 py-1.5 text-sm font-medium no-underline transition-colors"
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>

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
								<Link to="/login">Masuk</Link>
							</Button>
							<Button asChild size="sm" className="rounded-full">
								<Link to="/register">Daftar</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
