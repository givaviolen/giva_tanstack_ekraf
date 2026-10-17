import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, UserPlus, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/format";
import ThemeToggle from "./ThemeToggle";
import { Brand } from "./layout/Brand";

const NAV_LINKS = [
	{ to: "/" as const, label: "Beranda" },
	{ to: "/produk" as const, label: "Direktori Produk" },
];

export default function Header() {
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/login";
	};

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
					) : user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="hover:bg-accent focus-visible:ring-ring/50 flex items-center gap-2 rounded-full p-1 pr-2 outline-none transition-colors focus-visible:ring-2"
									aria-label="Menu profil"
								>
									<Avatar size="sm">
										{user.image ? <AvatarImage src={user.image} alt="" /> : null}
										<AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
									</Avatar>
									<span className="hidden text-sm font-medium sm:inline">
										{user.name?.trim() || "Akun"}
									</span>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-60">
								<DropdownMenuLabel className="flex flex-col gap-0.5">
									<span className="truncate text-sm font-semibold">{user.name?.trim() || "Akun"}</span>
									<span className="text-muted-foreground truncate text-xs font-normal">{user.email}</span>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to="/profile" className="cursor-pointer">
										<UserRound className="size-4" />
										Profil
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/dashboard" className="cursor-pointer">
										<LayoutDashboard className="size-4" />
										Dashboard
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
									<LogOut className="size-4" />
									Keluar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<>
							<Button asChild variant="ghost" size="sm" className="rounded-full">
								<Link to="/login">Masuk</Link>
							</Button>
							<Button asChild size="sm" className="rounded-full">
								<Link to="/register">
									<UserPlus className="size-4" />
									Daftar
								</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}