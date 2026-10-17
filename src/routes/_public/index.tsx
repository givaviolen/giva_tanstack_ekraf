import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Coffee, HandHeart, Leaf, ShoppingBasket, TreePine } from "lucide-react";

import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { getPublicProducts } from "@/lib/server/products";

export const Route = createFileRoute("/_public/")({
	loader: () => getPublicProducts(),
	head: () => ({
		meta: [
			{ title: "UKM Danau Toba — Direktori Produk Lokal" },
			{
				name: "description",
				content:
					"Direktori produk UMKM kawasan Danau Toba: kain ulos, kopi Lintong, kacang Sihobuk, ukiran kayu, dan kerajinan tangan Batak.",
			},
		],
	}),
	component: LandingPage,
});

const HIGHLIGHTS = [
	{
		icon: ShoppingBasket,
		title: "Kuliner Khas",
		description: "Kopi Lintong, kacang Sihobuk, dan sambal andaliman dari kebun sekitar danau.",
	},
	{
		icon: TreePine,
		title: "Kriya & Ukiran",
		description: "Ukiran kayu dan anyaman Batak yang dikerjakan langsung oleh pengrajin lokal.",
	},
	{
		icon: Leaf,
		title: "Bahan Alami",
		description: "Diproses secara tradisional dan ramah lingkungan di tepi Danau Toba.",
	},
	{
		icon: HandHeart,
		title: "Dukung UMKM",
		description: "Setiap pembelian membantu keluarga pengrajin dan ekonomi kawasan danau.",
	},
] as const;

function LandingPage() {
	const products = Route.useLoaderData();
	const featured = products.slice(0, 4);

	return (
		<div>
			{/* Hero */}
			<section className="from-primary/10 via-background relative overflow-hidden border-b bg-linear-to-b to-transparent">
				<div className="page-wrap grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
					<div className="text-center lg:text-left">
						<span className="border-border/70 bg-background/70 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs backdrop-blur">
							<span className="bg-destructive size-2 rounded-full" aria-hidden />
							Danau Toba, Sumatera Utara
						</span>
						<h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
							Produk UMKM <span className="text-primary">Kawasan Danau Toba</span>
						</h1>
						<p className="text-muted-foreground mx-auto mt-4 max-w-xl text-pretty sm:text-lg lg:mx-0">
							Jelajahi katalog produk lokal: kain ulos, kopi Lintong, kacang Sihobuk, hingga ukiran
							kayu khas Batak — langsung dari pengrajin dan petani sekitar danau.
						</p>
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
							<Button asChild size="lg" className="rounded-full">
								<Link to="/produk">
									Lihat Direktori Produk
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button asChild size="lg" variant="outline" className="rounded-full">
								<Link to="/login">Masuk Admin</Link>
							</Button>
						</div>
					</div>

					<Card className="bg-card/80 border-border/70 shadow-lg backdrop-blur">
						<CardContent className="grid gap-3">
							<div className="grid grid-cols-2 gap-3">
								{HIGHLIGHTS.slice(0, 2).map((item) => (
									<div key={item.title} className="bg-background rounded-xl border p-4">
										<item.icon className="text-primary size-5" />
										<p className="mt-2 text-sm font-semibold">{item.title}</p>
										<p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
									</div>
								))}
							</div>
							<div className="from-destructive/10 to-primary/10 rounded-xl border bg-linear-to-br p-4">
								<div className="flex items-center gap-2 text-sm font-semibold">
									<Coffee className="text-destructive size-4" />
									Kopi &amp; rempah favorit
								</div>
								<p className="text-muted-foreground mt-1 text-xs">
									Kopi arabika Lintong dan andaliman yang ditanam di dataran tinggi sekitar kaldera.
								</p>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{HIGHLIGHTS.slice(2).map((item) => (
									<div key={item.title} className="bg-background rounded-xl border p-4">
										<item.icon className="text-accent-foreground size-5" />
										<p className="mt-2 text-sm font-semibold">{item.title}</p>
										<p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Featured products */}
			<section className="page-wrap py-16">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Produk Unggulan</h2>
						<p className="text-muted-foreground mt-1">
							Sebagian dari {products.length} produk yang terdaftar di direktori.
						</p>
					</div>
					<Link
						to="/produk"
						className="text-primary inline-flex items-center gap-1 text-sm font-semibold no-underline hover:gap-2 transition-all"
					>
						Lihat semua
						<ArrowRight className="size-4" />
					</Link>
				</div>

				{featured.length === 0 ? (
					<p className="text-muted-foreground mt-6 text-sm">
						Belum ada produk. Buka halaman{" "}
						<Link to="/setup" className="text-primary font-medium hover:underline">
							/setup
						</Link>{" "}
						untuk melakukan seed data contoh.
					</p>
				) : (
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{featured.map((product) => (
							<Card key={product.id} className="gap-0 p-4 transition-shadow hover:shadow-md">
								<div className="flex items-start gap-3">
									<ProductThumbnail name={product.name} image={product.image} />
									<div className="min-w-0">
										<Badge variant="secondary" className="rounded-full">
											{product.category}
										</Badge>
										<h3 className="mt-1.5 truncate text-sm font-semibold">{product.name}</h3>
									</div>
								</div>
								<p className="text-muted-foreground mt-3 truncate text-xs">UMKM: {product.umkm}</p>
								<p className="text-destructive mt-1 text-sm font-semibold">
									{formatRupiah(product.price)}
								</p>
							</Card>
						))}
					</div>
				)}
			</section>

			{/* CTA */}
			<section className="bg-primary text-primary-foreground">
				<div className="page-wrap flex flex-wrap items-center justify-between gap-4 py-12">
					<div>
						<h2 className="text-xl font-bold">Kelola produk UMKM Anda</h2>
						<p className="text-primary-foreground/80 mt-1 text-sm">
							Masuk sebagai admin untuk menambah, mengubah, dan menghapus produk di direktori.
						</p>
					</div>
					<Button asChild variant="secondary" size="lg" className="rounded-full">
						<Link to="/login">
							Masuk ke Dashboard
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				</div>
			</section>
		</div>
	);
}
