import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Boxes,
	Package,
	PackagePlus,
	ShieldCheck,
	Tags,
	TrendingUp,
	Users,
} from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryBadgeClass } from "@/lib/catalog";
import { formatRupiah } from "@/lib/format";
import { getProducts } from "@/lib/server/products";
import { getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/_admin/dashboard")({
	head: () => ({
		meta: [{ title: "Ringkasan — UKM Danau Toba" }],
	}),
	component: DashboardPage,
});

function stockBadge(stock: number) {
	if (stock <= 0) return <Badge variant="destructive">Stok habis</Badge>;
	if (stock <= 5) return <Badge variant="warning">Stok rendah · {stock}</Badge>;
	return <Badge variant="secondary">{stock} tersedia</Badge>;
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

	const byCategory = products.reduce<Record<string, number>>((acc, product) => {
		acc[product.category] = (acc[product.category] ?? 0) + 1;
		return acc;
	}, {});
	const topCategories = Object.entries(byCategory)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 4);

	const firstName = viewer.name?.trim().split(" ")[0] || "Admin";

	return (
		<div className="space-y-6">
			{/* Sapaan */}
			<Card className="from-primary/10 via-primary/5 border-primary/15 overflow-hidden bg-linear-to-br to-transparent">
				<CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<p className="kicker">Ringkasan</p>
						<h2 className="text-2xl font-bold tracking-tight">Selamat datang, {firstName}</h2>
						<p className="text-muted-foreground text-sm">
							Berikut gambaran katalog produk UKM Danau Toba hari ini.
						</p>
					</div>
					{isAdmin ? (
						<Button asChild className="w-full sm:w-auto">
							<Link to="/products">
								<PackagePlus className="size-4" />
								Kelola produk
							</Link>
						</Button>
					) : null}
				</CardContent>
			</Card>

			{/* Statistik */}
			{productsQuery.isError ? (
				<ErrorState
					title="Produk tidak dapat dimuat"
					description={(productsQuery.error as Error)?.message}
					onRetry={() => void productsQuery.refetch()}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{productsQuery.isPending ? (
						Array.from({ length: isAdmin ? 4 : 2 }).map((_, index) => (
							<Card // biome-ignore lint/suspicious/noArrayIndexKey: skeleton statis
								key={`stat-skeleton-${index}`}
							>
								<CardContent className="py-2">
									<LoadingState rows={1} label="Memuat metrik" />
								</CardContent>
							</Card>
						))
					) : (
						<>
							<StatCard
								icon={Package}
								label="Produk"
								value={products.length}
								hint="Terdaftar di katalog"
							/>
							<StatCard
								icon={Boxes}
								label="Total stok"
								value={totalUnits}
								hint={`${lowStock} perlu perhatian`}
								tone={lowStock > 0 ? "warning" : "default"}
							/>
							{isAdmin ? (
								<StatCard
									icon={Tags}
									label="Kategori"
									value={Object.keys(byCategory).length}
									hint="Jenis produk UMKM"
								/>
							) : null}
							{isAdmin ? (
								<StatCard
									icon={Users}
									label="Pengguna"
									value={users.length}
									hint={`${adminCount} administrator`}
								/>
							) : null}
						</>
					)}
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Produk terbaru */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
						<div className="space-y-1">
							<CardTitle>Produk terbaru</CardTitle>
							<CardDescription>Penambahan terakhir pada katalog Anda.</CardDescription>
						</div>
						<Link
							to="/products"
							className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold no-underline transition-all hover:gap-2.5"
						>
							Lihat semua
							<ArrowRight className="size-4" />
						</Link>
					</CardHeader>
					<CardContent>
						{productsQuery.isPending ? (
							<LoadingState rows={4} />
						) : recent.length === 0 ? (
							<EmptyState
								icon={Package}
								title="Belum ada produk"
								description={
									isAdmin
										? "Tambahkan produk pertama Anda agar muncul di sini."
										: "Belum ada produk di katalog."
								}
								action={
									isAdmin ? (
										<Button asChild size="sm">
											<Link to="/products">Tambah produk</Link>
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
											<p className="text-muted-foreground truncate text-xs">{product.umkm}</p>
										</div>
										<div className="hidden shrink-0 text-right sm:block">
											<p className="text-sm font-semibold">{formatRupiah(product.price)}</p>
											<div className="mt-1">{stockBadge(product.stock)}</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{/* Kolom samping */}
				<div className="space-y-6">
					{topCategories.length > 0 ? (
						<Card>
							<CardHeader>
								<CardTitle>Sebaran kategori</CardTitle>
								<CardDescription>Jumlah produk per kategori.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2">
								{topCategories.map(([category, count]) => (
									<div key={category} className="flex items-center justify-between gap-2 text-sm">
										<span
											className={`rounded-full border px-2 py-0.5 text-xs ${categoryBadgeClass(category)}`}
										>
											{category}
										</span>
										<span className="text-muted-foreground tabular-nums">{count} produk</span>
									</div>
								))}
							</CardContent>
						</Card>
					) : null}

					<Card>
						<CardHeader>
							<CardTitle>Aksi cepat</CardTitle>
							<CardDescription>Lompat langsung ke tugas yang Anda butuhkan.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-2">
							<Button asChild variant="outline" className="justify-start">
								<Link to="/products">
									<Package className="size-4" />
									Lihat katalog produk
								</Link>
							</Button>
							{isAdmin ? (
								<Button asChild variant="outline" className="justify-start">
									<Link to="/users">
										<Users className="size-4" />
										Kelola pengguna &amp; role
									</Link>
								</Button>
							) : null}
							<Button asChild variant="outline" className="justify-start">
								<Link to="/produk">
									<TrendingUp className="size-4" />
									Buka direktori publik
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<span className="bg-primary/10 text-primary mb-1 grid size-9 place-items-center rounded-xl">
								<ShieldCheck className="size-4.5" />
							</span>
							<CardTitle className="text-base">Penyimpanan sementara</CardTitle>
							<CardDescription>
								Data hanya bertahan selama proses server berjalan dan ter-reset saat restart.
								Jalankan ulang{" "}
								<Link to="/setup" className="text-primary font-medium hover:underline">
									seed data
								</Link>{" "}
								setelah cold start.
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
