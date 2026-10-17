import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	createColumnHelper,
	flexRender,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SortIndicator } from "@/components/common/SortIndicator";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PRODUCT_CATEGORIES, categoryBadgeClass } from "@/lib/catalog";
import type { Product } from "@/lib/db";
import { toUserMessage } from "@/lib/errors";
import { formatDate, formatRupiah } from "@/lib/format";
import { deleteProduct, getProducts } from "@/lib/server/products";

export const Route = createFileRoute("/_admin/products")({
	head: () => ({
		meta: [{ title: "Produk — UKM Danau Toba" }],
	}),
	component: ProductsPage,
});

const features = tableFeatures({ rowSortingFeature });
const columnHelper = createColumnHelper<typeof features, Product>();

function StockBadge({ stock }: { stock: number }) {
	if (stock <= 0) return <Badge variant="destructive">Stok habis</Badge>;
	if (stock <= 5) return <Badge variant="warning">Rendah · {stock}</Badge>;
	return <Badge variant="secondary">{stock} tersedia</Badge>;
}

function CategoryBadge({ category }: { category: string }) {
	return (
		<span
			className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryBadgeClass(category)}`}
		>
			{category}
		</span>
	);
}

function ProductsPage() {
	const { role } = Route.useRouteContext();
	const isAdmin = role === "admin";

	const queryClient = useQueryClient();
	const productsQuery = useQuery({
		queryKey: ["products"],
		queryFn: async () => getProducts(),
	});
	const deleteFn = useServerFn(deleteProduct);

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("Semua");
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Product | null>(null);
	const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [actionError, setActionError] = useState("");

	const products = productsQuery.data ?? [];
	const query = search.trim().toLowerCase();
	const filtered = products.filter((product) => {
		const matchesCategory = category === "Semua" || product.category === category;
		const matchesQuery =
			query === "" ||
			product.name.toLowerCase().includes(query) ||
			product.umkm.toLowerCase().includes(query) ||
			product.description.toLowerCase().includes(query);
		return matchesCategory && matchesQuery;
	});

	const refresh = () => queryClient.invalidateQueries({ queryKey: ["products"] });

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (product: Product) => {
		setEditing(product);
		setFormOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		setDeleting(true);
		setActionError("");
		try {
			await deleteFn({ data: { id: pendingDelete.id } });
			await refresh();
			setPendingDelete(null);
		} catch (error) {
			setActionError(toUserMessage(error, "Produk tidak dapat dihapus."));
		} finally {
			setDeleting(false);
		}
	};

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
			cell: (info) => <span className="text-muted-foreground text-sm">{info.getValue()}</span>,
		}),
		columnHelper.accessor("category", {
			header: "Kategori",
			cell: (info) => <CategoryBadge category={info.getValue()} />,
		}),
		columnHelper.accessor("price", {
			header: "Harga",
			cell: (info) => (
				<span className="font-medium tabular-nums">{formatRupiah(Number(info.getValue()))}</span>
			),
		}),
		columnHelper.accessor("stock", {
			header: "Stok",
			cell: (info) => <StockBadge stock={Number(info.getValue())} />,
		}),
		columnHelper.accessor("updatedAt", {
			header: "Diperbarui",
			cell: (info) => (
				<span className="text-muted-foreground text-xs">{formatDate(String(info.getValue()))}</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: "Aksi",
			cell: (info) => {
				if (!isAdmin) return null;
				const product = info.row.original;
				return (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => openEdit(product)}
							aria-label={`Ubah ${product.name}`}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-destructive hover:text-destructive"
							onClick={() => {
								setActionError("");
								setPendingDelete(product);
							}}
							aria-label={`Hapus ${product.name}`}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				);
			},
		}),
	]);

	const table = useTable({
		features,
		columns,
		data: filtered,
	});

	const hasProducts = products.length > 0;
	const isEmpty = !productsQuery.isPending && filtered.length === 0;

	return (
		<div className="space-y-6">
			{actionError ? (
				<Alert variant="destructive">
					<AlertDescription>{actionError}</AlertDescription>
				</Alert>
			) : null}

			<Card className="overflow-hidden py-0">
				{/* Toolbar */}
				<div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<div className="min-w-0">
						<h2 className="text-base font-semibold tracking-tight">Katalog produk</h2>
						<p className="text-muted-foreground text-xs">
							{productsQuery.isPending
								? "Memuat produk…"
								: query || category !== "Semua"
									? `${filtered.length} dari ${products.length} produk`
									: `${products.length} produk`}
						</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="relative w-full sm:w-56">
							<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
							<Input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Cari produk atau UMKM…"
								className="h-9 pl-9"
								aria-label="Cari produk"
							/>
						</div>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filter kategori">
								<SelectValue placeholder="Semua" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Semua">Semua kategori</SelectItem>
								{PRODUCT_CATEGORIES.map((item) => (
									<SelectItem key={item} value={item}>
										{item}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{isAdmin ? (
							<Button onClick={openCreate} disabled={productsQuery.isPending}>
								<Plus className="size-4" />
								Produk baru
							</Button>
						) : null}
					</div>
				</div>

				{/* Konten */}
				{productsQuery.isPending ? (
					<div className="p-6">
						<LoadingState rows={5} label="Memuat produk" />
					</div>
				) : productsQuery.isError ? (
					<div className="p-6">
						<ErrorState
							title="Produk tidak dapat dimuat"
							description={toUserMessage(productsQuery.error)}
							onRetry={() => void productsQuery.refetch()}
						/>
					</div>
				) : isEmpty ? (
					<div className="p-6">
						<EmptyState
							icon={Package}
							title={hasProducts ? "Tidak ada produk yang cocok" : "Belum ada produk"}
							description={
								hasProducts
									? "Coba ubah kata kunci atau pilih kategori lain."
									: isAdmin
										? "Tambahkan produk pertama untuk mulai membangun katalog."
										: "Belum ada produk di katalog."
							}
							action={
								!hasProducts && isAdmin ? (
									<Button onClick={openCreate}>
										<Plus className="size-4" />
										Tambah produk
									</Button>
								) : null
							}
						/>
					</div>
				) : (
					<>
						{/* Tabel desktop */}
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

						{/* Kartu mobile */}
						<ul className="divide-border divide-y md:hidden">
							{filtered.map((product) => (
								<li key={product.id} className="space-y-3 p-4">
									<div className="flex items-center gap-3">
										<ProductThumbnail name={product.name} image={product.image} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">{product.name}</p>
											<p className="text-muted-foreground truncate text-xs">{product.umkm}</p>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<CategoryBadge category={product.category} />
										<span className="text-sm font-semibold tabular-nums">
											{formatRupiah(product.price)}
										</span>
										<StockBadge stock={product.stock} />
									</div>
									{isAdmin ? (
										<div className="flex items-center gap-1">
											<Button variant="outline" size="sm" onClick={() => openEdit(product)}>
												<Pencil className="size-4" />
												Ubah
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												className="text-destructive hover:text-destructive"
												onClick={() => {
													setActionError("");
													setPendingDelete(product);
												}}
												aria-label={`Hapus ${product.name}`}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									) : null}
								</li>
							))}
						</ul>
					</>
				)}
			</Card>

			<ProductFormModal
				open={formOpen}
				onOpenChange={setFormOpen}
				product={editing}
				onSaved={() => void refresh()}
			/>

			<ConfirmDialog
				open={Boolean(pendingDelete)}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null);
				}}
				title="Hapus produk ini?"
				description={
					pendingDelete ? (
						<>
							<span className="font-medium">{pendingDelete.name}</span> akan dihapus permanen dari
							katalog. Tindakan ini tidak dapat dibatalkan.
						</>
					) : null
				}
				confirmLabel="Hapus produk"
				onConfirm={handleConfirmDelete}
				loading={deleting}
			/>
		</div>
	);
}
