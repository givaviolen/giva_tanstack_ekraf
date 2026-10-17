import { Link, createFileRoute } from "@tanstack/react-router";
import {
	createColumnHelper,
	flexRender,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SortIndicator } from "@/components/common/SortIndicator";
import { EmptyState } from "@/components/common/States";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { PRODUCT_CATEGORIES } from "@/lib/catalog";
import { formatDate, formatRupiah } from "@/lib/format";
import { getPublicProducts } from "@/lib/server/products";

export const Route = createFileRoute("/_public/produk")({
	loader: () => getPublicProducts(),
	head: () => ({
		meta: [
			{ title: "Direktori Produk — UKM Danau Toba" },
			{
				name: "description",
				content:
					"Direktori lengkap produk UMKM kawasan Danau Toba: kain ulos, kopi, kerajinan kayu, cendera mata, dan kuliner lokal.",
			},
		],
	}),
	component: ProdukPage,
});

type PublicProduct = Awaited<ReturnType<typeof getPublicProducts>>[number];

const features = tableFeatures({ rowSortingFeature });
const columnHelper = createColumnHelper<typeof features, PublicProduct>();

const columns = columnHelper.columns([
	columnHelper.accessor("name", {
		header: "Produk",
		cell: (info) => {
			const product = info.row.original;
			return (
				<div className="flex items-center gap-3">
					<ProductThumbnail name={product.name} image={product.image} />
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">{product.name}</p>
						<p className="text-muted-foreground line-clamp-1 text-xs">{product.description}</p>
					</div>
				</div>
			);
		},
	}),
	columnHelper.accessor("umkm", {
		header: "UMKM",
		cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
	}),
	columnHelper.accessor("category", {
		header: "Kategori",
		cell: (info) => (
			<Badge variant="secondary" className="rounded-full">
				{info.getValue()}
			</Badge>
		),
	}),
	columnHelper.accessor("price", {
		header: "Harga",
		cell: (info) => (
			<span className="font-semibold tabular-nums">{formatRupiah(Number(info.getValue()))}</span>
		),
	}),
	columnHelper.accessor("stock", {
		header: "Stok",
		cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
	}),
	columnHelper.accessor("updatedAt", {
		header: "Diperbarui",
		cell: (info) => (
			<span className="text-muted-foreground text-xs">{formatDate(String(info.getValue()))}</span>
		),
	}),
]);

function ProdukPage() {
	const products = Route.useLoaderData();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("Semua");

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return products.filter((product) => {
			const matchesCategory = category === "Semua" || product.category === category;
			const matchesQuery =
				query === "" ||
				product.name.toLowerCase().includes(query) ||
				product.umkm.toLowerCase().includes(query) ||
				product.description.toLowerCase().includes(query);
			return matchesCategory && matchesQuery;
		});
	}, [products, search, category]);

	const table = useTable({
		features,
		columns,
		data: filtered,
	});

	const isEmpty = filtered.length === 0;

	return (
		<div className="page-wrap py-10">
			<header className="text-center">
				<span className="border-border/70 bg-background inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
					<span className="bg-destructive size-2 rounded-full" aria-hidden />
					Direktori Publik
				</span>
				<h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
					Produk UKM Danau Toba
				</h1>
				<p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-sm sm:text-base">
					Temukan produk unggulan dari UMKM kawasan Danau Toba. Klik judul kolom untuk mengurutkan,
					atau gunakan pencarian untuk menyaring produk.
				</p>
			</header>

			<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					<Input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Cari produk, UMKM, atau deskripsi…"
						className="h-10 pl-9"
						aria-label="Cari produk"
					/>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-muted-foreground">Kategori</span>
					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger className="h-10 w-44" aria-label="Filter kategori">
							<SelectValue placeholder="Semua" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Semua">Semua</SelectItem>
							{PRODUCT_CATEGORIES.map((item) => (
								<SelectItem key={item} value={item}>
									{item}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<Card className="mt-4 overflow-hidden py-0">
				{isEmpty ? (
					<div className="p-6">
						<EmptyState
							icon={PackageSearch}
							title="Tidak ada produk yang cocok"
							description="Coba ubah kata kunci pencarian atau pilih kategori “Semua”."
						/>
					</div>
				) : (
					<>
						{/* Desktop table */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									{table.getHeaderGroups().map((headerGroup) => (
										<TableRow key={headerGroup.id} className="hover:bg-transparent">
											{headerGroup.headers.map((header) => (
												<TableHead key={header.id} colSpan={header.colSpan}>
													{header.isPlaceholder ? null : header.column.getCanSort() ? (
														<button
															type="button"
															onClick={header.column.getToggleSortingHandler()}
															className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 uppercase transition-colors"
														>
															{flexRender(header.column.columnDef.header, header.getContext())}
															<SortIndicator sorted={header.column.getIsSorted()} />
														</button>
													) : (
														flexRender(header.column.columnDef.header, header.getContext())
													)}
												</TableHead>
											))}
										</TableRow>
									))}
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getAllCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Mobile cards */}
						<ul className="divide-border divide-y md:hidden">
							{filtered.map((product) => (
								<li key={product.id} className="space-y-3 p-4">
									<div className="flex items-start gap-3">
										<ProductThumbnail name={product.name} image={product.image} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">{product.name}</p>
											<p className="text-muted-foreground mt-0.5 truncate text-xs">
												{product.umkm}
											</p>
										</div>
										<Badge variant="secondary" className="rounded-full">
											{product.category}
										</Badge>
									</div>
									<p className="text-muted-foreground line-clamp-2 text-xs">
										{product.description}
									</p>
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">{formatRupiah(product.price)}</span>
										<span className="text-muted-foreground text-xs">Stok {product.stock}</span>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</Card>

			<p className="text-muted-foreground mt-4 text-center text-sm">
				Ingin menambah produk Anda sendiri?{" "}
				<Link to="/login" className="text-primary font-medium hover:underline">
					Masuk sebagai admin
				</Link>
			</p>
		</div>
	);
}
