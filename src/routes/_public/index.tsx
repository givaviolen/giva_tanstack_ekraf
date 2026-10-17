import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Boxes,
	LayoutDashboard,
	ShieldCheck,
	SlidersHorizontal,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_public/")({
	head: () => ({
		meta: [{ title: "Ekraf Dashboard — Secure admin for products & users" }],
	}),
	component: Home,
});

const FEATURES = [
	{
		icon: Boxes,
		title: "Product catalogue",
		description:
			"Create, edit and organise products with inline image uploads, live previews and instant validation.",
	},
	{
		icon: Users,
		title: "Users & roles",
		description:
			"Invite teammates, promote administrators and keep access scoped with role-aware navigation.",
	},
	{
		icon: ShieldCheck,
		title: "Secure by default",
		description:
			"Every mutation is re-authorised on the server with Better Auth sessions and Zod validation.",
	},
];

function Home() {
	const { data: session, isPending } = authClient.useSession();

	return (
		<main className="pb-4">
			{/* Hero */}
			<section className="page-wrap pt-14 pb-20 sm:pt-20 sm:pb-24">
				<div className="mx-auto max-w-3xl text-center">
					<span className="border-primary/20 bg-primary/8 text-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold">
						<SlidersHorizontal className="size-3.5" />
						Admin workspace
					</span>

					<h1 className="rise-in mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
						Run your catalogue and team from one calm dashboard.
					</h1>
					<p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
						Ekraf Dashboard pairs TanStack Start with Better Auth for a focused admin experience —
						products, users and roles, all secured end to end.
					</p>

					<div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
						{isPending ? (
							<div className="bg-muted h-11 w-52 animate-pulse rounded-xl" />
						) : session?.user ? (
							<Button asChild size="lg" className="w-full sm:w-auto">
								<Link to="/dashboard">
									<LayoutDashboard className="size-4.5" />
									Open dashboard
								</Link>
							</Button>
						) : (
							<>
								<Button asChild size="lg" className="w-full sm:w-auto">
									<Link to="/register">
										Create account
										<ArrowRight className="size-4.5" />
									</Link>
								</Button>
								<Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
									<Link to="/login">Sign in</Link>
								</Button>
							</>
						)}
					</div>

					{!isPending && !session?.user ? (
						<p className="text-muted-foreground mt-4 text-sm">
							First run?{" "}
							<Link to="/setup" className="text-primary font-medium hover:underline">
								Seed the admin account
							</Link>{" "}
							to unlock product and user management.
						</p>
					) : null}
				</div>
			</section>

			{/* Features */}
			<section className="page-wrap pb-20">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature) => {
						const Icon = feature.icon;
						return (
							<Card
								key={feature.title}
								className="hover:border-primary/30 transition-colors hover:shadow-md"
							>
								<CardHeader>
									<span className="bg-primary/10 text-primary mb-1 grid size-11 place-items-center rounded-xl">
										<Icon className="size-5" />
									</span>
									<CardTitle className="text-base">{feature.title}</CardTitle>
									<CardDescription>{feature.description}</CardDescription>
								</CardHeader>
								<CardContent className="mt-auto">
									<Link
										to={session?.user ? "/dashboard" : "/login"}
										className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold no-underline hover:gap-2.5 transition-all"
									>
										{session?.user ? "Go to dashboard" : "Sign in to explore"}
										<ArrowRight className="size-4" />
									</Link>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>
		</main>
	);
}
