import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Boxes,
	Package,
	PackagePlus,
	ShieldCheck,
	TrendingUp,
	Users,
} from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getProducts } from "@/lib/server/products";
import { getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/_admin/dashboard")({
	head: () => ({
		meta: [{ title: "Dashboard — Ekraf" }],
	}),
	component: DashboardPage,
});

function stockBadge(stock: number) {
	if (stock <= 0) return <Badge variant="destructive">Out of stock</Badge>;
	if (stock <= 5) return <Badge variant="warning">Low · {stock}</Badge>;
	return <Badge variant="secondary">{stock} in stock</Badge>;
}

function DashboardPage() {
	const { viewer, role } = Route.useRouteContext();
	const isAdmin = role === "admin";

	const productsQuery = useQuery({
		queryKey: ["products"],
		queryFn: async () => getProducts(),
	});
	const usersQuery = useQuery({
		queryKey: ["users"],
		queryFn: async () => getUsers(),
		enabled: isAdmin,
	});

	const products = productsQuery.data ?? [];
	const users = usersQuery.data ?? [];
	const adminCount = users.filter((user) => user.role === "admin").length;
	const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
	const recent = products.slice(0, 5);
	const lowStock = products.filter((product) => product.stock <= 5).length;

	const firstName = viewer.name?.trim().split(" ")[0] || "there";

	return (
		<div className="space-y-6">
			{/* Welcome banner */}
			<Card className="from-primary/10 via-primary/5 overflow-hidden border-primary/15 bg-linear-to-br to-transparent">
				<CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<p className="kicker">Overview</p>
						<h2 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h2>
						<p className="text-muted-foreground text-sm">
							Here&apos;s how your catalogue is doing today.
						</p>
					</div>
					{isAdmin ? (
						<Button asChild className="w-full sm:w-auto">
							<Link to="/products">
								<PackagePlus className="size-4" />
								Manage products
							</Link>
						</Button>
					) : null}
				</CardContent>
			</Card>

			{/* Stats */}
			{productsQuery.isError ? (
				<ErrorState
					title="We couldn't load your products"
					description={(productsQuery.error as Error)?.message}
					onRetry={() => void productsQuery.refetch()}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{productsQuery.isPending ? (
						Array.from({ length: isAdmin ? 4 : 2 }).map((_, index) => (
							<Card // biome-ignore lint/suspicious/noArrayIndexKey: pending skeletons
								key={`stat-skeleton-${index}`}
							>
								<CardContent className="py-2">
									<LoadingState rows={1} label="Loading metrics" />
								</CardContent>
							</Card>
						))
					) : (
						<>
							<StatCard
								icon={Package}
								label="Products"
								value={products.length}
								hint="In your catalogue"
							/>
							<StatCard
								icon={Boxes}
								label="Units in stock"
								value={totalUnits}
								hint={`${lowStock} need${lowStock === 1 ? "s" : ""} attention`}
								tone={lowStock > 0 ? "warning" : "default"}
							/>
							{isAdmin ? (
								<StatCard
									icon={Users}
									label="Users"
									value={users.length}
									hint="Registered accounts"
								/>
							) : null}
							{isAdmin ? (
								<StatCard
									icon={ShieldCheck}
									label="Administrators"
									value={adminCount}
									hint="Full access members"
								/>
							) : null}
						</>
					)}
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Recent products */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
						<div className="space-y-1">
							<CardTitle>Recent products</CardTitle>
							<CardDescription>The latest additions to your catalogue.</CardDescription>
						</div>
						<Link
							to="/products"
							className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold no-underline hover:gap-2.5 transition-all"
						>
							View all
							<ArrowRight className="size-4" />
						</Link>
					</CardHeader>
					<CardContent>
						{productsQuery.isPending ? (
							<LoadingState rows={4} />
						) : recent.length === 0 ? (
							<EmptyState
								icon={Package}
								title="No products yet"
								description={
									isAdmin
										? "Add your first product to see it appear here."
										: "There are no products in the catalogue yet."
								}
								action={
									isAdmin ? (
										<Button asChild size="sm">
											<Link to="/products">Add a product</Link>
										</Button>
									) : null
								}
							/>
						) : (
							<ul className="divide-border divide-y">
								{recent.map((product) => (
									<li
										key={product.id}
										className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
									>
										<ProductThumbnail name={product.name} image={product.image} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">{product.name}</p>
											<p className="text-muted-foreground truncate text-xs">
												{product.description}
											</p>
										</div>
										<div className="hidden shrink-0 text-right sm:block">
											<p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
											<div className="mt-1">{stockBadge(product.stock)}</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{/* Side column */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Quick actions</CardTitle>
							<CardDescription>Jump straight to the tasks you need.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-2">
							<Button asChild variant="outline" className="justify-start">
								<Link to="/products">
									<Package className="size-4" />
									Browse products
								</Link>
							</Button>
							{isAdmin ? (
								<Button asChild variant="outline" className="justify-start">
									<Link to="/users">
										<Users className="size-4" />
										Manage users & roles
									</Link>
								</Button>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<span className="bg-primary/10 text-primary mb-1 grid size-9 place-items-center rounded-xl">
								<TrendingUp className="size-4.5" />
							</span>
							<CardTitle className="text-base">In-memory workspace</CardTitle>
							<CardDescription>
								Data lives for the lifetime of the server process and resets on restart. Re-run{" "}
								<Link to="/setup" className="text-primary font-medium hover:underline">
									seed
								</Link>{" "}
								after a cold start.
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	hint,
	tone = "default",
}: {
	icon: typeof Package;
	label: string;
	value: number;
	hint: string;
	tone?: "default" | "warning";
}) {
	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardContent className="flex items-start gap-4">
				<span
					className={
						tone === "warning"
							? "bg-warning/15 text-warning-foreground dark:text-warning grid size-11 shrink-0 place-items-center rounded-xl"
							: "bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl"
					}
				>
					<Icon className="size-5" />
				</span>
				<div className="min-w-0 space-y-0.5">
					<p className="text-muted-foreground text-sm font-medium">{label}</p>
					<p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
					<p className="text-muted-foreground truncate text-xs">{hint}</p>
				</div>
			</CardContent>
		</Card>
	);
}
