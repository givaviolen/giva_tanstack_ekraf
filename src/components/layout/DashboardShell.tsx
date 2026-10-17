import { Link, useRouterState } from "@tanstack/react-router";
import {
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Menu,
	Package,
	PanelLeftClose,
	PanelLeftOpen,
	Users,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/db";
import { initials } from "@/lib/format";
import ThemeToggle from "../ThemeToggle";
import { Brand } from "./Brand";

export interface Viewer {
	name?: string | null;
	email: string;
	image?: string | null;
}

interface NavItemConfig {
	to: "/dashboard" | "/products" | "/users";
	label: string;
	icon: LucideIcon;
	adminOnly?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
	{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/products", label: "Products", icon: Package },
	{ to: "/users", label: "Users", icon: Users, adminOnly: true },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
	"/dashboard": { title: "Dashboard", subtitle: "A snapshot of your workspace" },
	"/products": { title: "Products", subtitle: "Create, edit and organise your catalogue" },
	"/users": { title: "Users", subtitle: "Manage accounts and roles" },
};

function metaFor(pathname: string) {
	const match = Object.keys(PAGE_META).find(
		(key) => pathname === key || pathname.startsWith(`${key}/`),
	);
	const key = match ?? "/dashboard";
	return PAGE_META[key];
}

function useSidebarCollapsed() {
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		try {
			setCollapsed(window.localStorage.getItem("ekraf:sidebar") === "collapsed");
		} catch {
			// ignore
		}
	}, []);

	const toggle = () => {
		setCollapsed((previous) => {
			const next = !previous;
			try {
				window.localStorage.setItem("ekraf:sidebar", next ? "collapsed" : "expanded");
			} catch {
				// ignore
			}
			return next;
		});
	};

	return { collapsed, toggle };
}

function NavList({
	collapsed = false,
	role,
	onNavigate,
}: {
	collapsed?: boolean;
	role: Role;
	onNavigate?: () => void;
}) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });

	return (
		<nav className="flex flex-1 flex-col gap-1 px-3">
			{NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin").map((item) => {
				const active =
					item.to === "/dashboard"
						? pathname === "/dashboard"
						: pathname === item.to || pathname.startsWith(`${item.to}/`);
				const Icon = item.icon;
				return (
					<Link
						key={item.to}
						to={item.to}
						onClick={onNavigate}
						aria-current={active ? "page" : undefined}
						title={collapsed ? item.label : undefined}
						className={cn(
							"group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
							collapsed && "justify-center px-0",
							active
								? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						<Icon className="size-4.5 shrink-0" />
						{!collapsed ? <span className="truncate">{item.label}</span> : null}
					</Link>
				);
			})}
		</nav>
	);
}

function UserCard({
	viewer,
	role,
	collapsed,
}: {
	viewer: Viewer;
	role: Role;
	collapsed?: boolean;
}) {
	return (
		<div
			className={cn(
				"border-sidebar-border bg-card/60 flex items-center gap-3 rounded-xl border p-2.5",
				collapsed && "justify-center border-transparent bg-transparent p-0",
			)}
		>
			<Avatar size="default">
				{viewer.image ? <AvatarImage src={viewer.image} alt="" /> : null}
				<AvatarFallback>{initials(viewer.name, viewer.email)}</AvatarFallback>
			</Avatar>
			{!collapsed ? (
				<div className="min-w-0 flex-1">
					<p className="text-foreground truncate text-sm font-semibold">
						{viewer.name?.trim() || "Account"}
					</p>
					<p className="text-muted-foreground truncate text-xs">{viewer.email}</p>
				</div>
			) : null}
			{!collapsed ? (
				<Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
					{role}
				</Badge>
			) : null}
		</div>
	);
}

function SidebarBody({
	collapsed,
	role,
	viewer,
	onNavigate,
	onCollapseToggle,
}: {
	collapsed: boolean;
	role: Role;
	viewer: Viewer;
	onNavigate?: () => void;
	onCollapseToggle?: () => void;
}) {
	return (
		<div className="flex h-full flex-col">
			<div
				className={cn(
					"flex h-16 items-center gap-2 px-4",
					collapsed ? "justify-center px-0" : "justify-between",
				)}
			>
				<Brand compact={collapsed} to="/dashboard" />
				{onCollapseToggle && !collapsed ? (
					<Button
						variant="ghost"
						size="icon-sm"
						className="text-muted-foreground hover:text-foreground"
						onClick={onCollapseToggle}
						aria-label="Collapse sidebar"
					>
						<PanelLeftClose className="size-4" />
					</Button>
				) : null}
			</div>

			{onCollapseToggle && collapsed ? (
				<div className="flex justify-center pb-2">
					<Button
						variant="ghost"
						size="icon-sm"
						className="text-muted-foreground hover:text-foreground"
						onClick={onCollapseToggle}
						aria-label="Expand sidebar"
					>
						<PanelLeftOpen className="size-4" />
					</Button>
				</div>
			) : null}

			<NavList collapsed={collapsed} role={role} onNavigate={onNavigate} />

			<div className="p-3">
				<Separator className="mb-3" />
				<UserCard viewer={viewer} role={role} collapsed={collapsed} />
			</div>
		</div>
	);
}

export function DashboardShell({
	viewer,
	role,
	children,
}: {
	viewer: Viewer;
	role: Role;
	children: ReactNode;
}) {
	const { collapsed, toggle } = useSidebarCollapsed();
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const meta = metaFor(pathname);

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/login";
	};

	return (
		<div className="bg-background min-h-dvh">
			{/* Desktop sidebar */}
			<aside
				className={cn(
					"bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-40 hidden border-r transition-[width] duration-200 lg:block",
					collapsed ? "w-[4.75rem]" : "w-[16.5rem]",
				)}
			>
				<SidebarBody collapsed={collapsed} role={role} viewer={viewer} onCollapseToggle={toggle} />
			</aside>

			{/* Mobile drawer */}
			<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
				<SheetContent side="left" showCloseButton={false} className="bg-sidebar w-[17rem] p-0">
					<SheetTitle className="sr-only">Navigation</SheetTitle>
					<SidebarBody
						collapsed={false}
						role={role}
						viewer={viewer}
						onNavigate={() => setMobileOpen(false)}
					/>
				</SheetContent>
			</Sheet>

			<div
				className={cn(
					"flex min-h-dvh flex-col transition-[padding] duration-200",
					collapsed ? "lg:pl-[4.75rem]" : "lg:pl-[16.5rem]",
				)}
			>
				<header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur-lg">
					<div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden"
							onClick={() => setMobileOpen(true)}
							aria-label="Open navigation"
						>
							<Menu className="size-5" />
						</Button>

						<div className="min-w-0 flex-1">
							<h1 className="text-foreground truncate text-lg font-semibold tracking-tight">
								{meta.title}
							</h1>
							<p className="text-muted-foreground hidden truncate text-xs sm:block">
								{meta.subtitle}
							</p>
						</div>

						<ThemeToggle />

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="hover:bg-accent flex items-center gap-2 rounded-full p-1 pr-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
									aria-label="Account menu"
								>
									<Avatar size="sm">
										{viewer.image ? <AvatarImage src={viewer.image} alt="" /> : null}
										<AvatarFallback>{initials(viewer.name, viewer.email)}</AvatarFallback>
									</Avatar>
									<span className="hidden text-sm font-medium sm:inline">
										{viewer.name?.trim() || "Account"}
									</span>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-60">
								<DropdownMenuLabel className="flex flex-col gap-0.5">
									<span className="truncate text-sm font-semibold">
										{viewer.name?.trim() || "Account"}
									</span>
									<span className="text-muted-foreground truncate text-xs font-normal">
										{viewer.email}
									</span>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to="/dashboard" className="cursor-pointer">
										<LayoutDashboard className="size-4" />
										Go to dashboard
									</Link>
								</DropdownMenuItem>
								{role === "admin" ? (
									<DropdownMenuItem asChild>
										<Link to="/users" className="cursor-pointer">
											<Users className="size-4" />
											Manage users
										</Link>
									</DropdownMenuItem>
								) : null}
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
									<LogOut className="size-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				<main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					{children}
				</main>
			</div>
		</div>
	);
}
