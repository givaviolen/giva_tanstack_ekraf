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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteProduct, getProducts } from "@/lib/server/products";

export const Route = createFileRoute("/_admin/products")({
	head: () => ({
		meta: [{ title: "Products — Ekraf" }],
	}),
	component: ProductsPage,
});

const features = tableFeatures({ rowSortingFeature });
const columnHelper = createColumnHelper<typeof features, Product>();

function StockBadge({ stock }: { stock: number }) {
	if (stock <= 0) return <Badge variant="destructive">Out of stock</Badge>;
	if (stock <= 5) return <Badge variant="warning">Low · {stock}</Badge>;
	return <Badge variant="secondary">{stock} in stock</Badge>;
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
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Product | null>(null);
	const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [actionError, setActionError] = useState("");

	const products = productsQuery.data ?? [];
	const query = search.trim().toLowerCase();
	const filtered = query
		? products.filter(
				(product) =>
					product.name.toLowerCase().includes(query) ||
					product.description.toLowerCase().includes(query),
			)
		: products;

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
			setActionError(error instanceof Error ? error.message : "Could not delete the product");
		} finally {
			setDeleting(false);
		}
	};

	const columns = columnHelper.columns([
		columnHelper.accessor("name", {
			header: "Product",
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
		columnHelper.accessor("price", {
			header: "Price",
			cell: (info) => (
				<span className="font-medium tabular-nums">{formatCurrency(Number(info.getValue()))}</span>
			),
		}),
		columnHelper.accessor("stock", {
			header: "Stock",
			cell: (info) => <StockBadge stock={Number(info.getValue())} />,
		}),
		columnHelper.accessor("updatedAt", {
			header: "Updated",
			cell: (info) => (
				<span className="text-muted-foreground text-xs">{formatDate(String(info.getValue()))}</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: (info) => {
				if (!isAdmin) return null;
				const product = info.row.original;
				return (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => openEdit(product)}
							aria-label={`Edit ${product.name}`}
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
							aria-label={`Delete ${product.name}`}
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
						<h2 className="text-base font-semibold tracking-tight">Catalogue</h2>
						<p className="text-muted-foreground text-xs">
							{productsQuery.isPending
								? "Loading products…"
								: query
									? `${filtered.length} of ${products.length} product${products.length === 1 ? "" : "s"}`
									: `${products.length} product${products.length === 1 ? "" : "s"} total`}
						</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="relative w-full sm:w-64">
							<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
							<Input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search products…"
								className="h-9 pl-9"
								aria-label="Search products"
							/>
						</div>
						{isAdmin ? (
							<Button onClick={openCreate} disabled={productsQuery.isPending}>
								<Plus className="size-4" />
								New product
							</Button>
						) : null}
					</div>
				</div>

				{/* Content */}
				{productsQuery.isPending ? (
					<div className="p-6">
						<LoadingState rows={5} label="Loading products" />
					</div>
				) : productsQuery.isError ? (
					<div className="p-6">
						<ErrorState
							title="We couldn't load your products"
							description={(productsQuery.error as Error)?.message}
							onRetry={() => void productsQuery.refetch()}
						/>
					</div>
				) : isEmpty ? (
					<div className="p-6">
						<EmptyState
							icon={Package}
							title={hasProducts ? "No matching products" : "No products yet"}
							description={
								hasProducts
									? "Try a different search term to find what you're looking for."
									: isAdmin
										? "Add your first product to start building your catalogue."
										: "There are no products in the catalogue yet."
							}
							action={
								!hasProducts && isAdmin ? (
									<Button onClick={openCreate}>
										<Plus className="size-4" />
										Add a product
									</Button>
								) : null
							}
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
						<ul className="divide-y md:hidden">
							{filtered.map((product) => (
								<li key={product.id} className="space-y-3 p-4">
									<div className="flex items-center gap-3">
										<ProductThumbnail name={product.name} image={product.image} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">{product.name}</p>
											<p className="text-muted-foreground line-clamp-2 text-xs">
												{product.description}
											</p>
										</div>
									</div>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold tabular-nums">
												{formatCurrency(product.price)}
											</span>
											<StockBadge stock={product.stock} />
										</div>
										{isAdmin ? (
											<div className="flex items-center gap-1">
												<Button
													variant="outline"
													size="sm"
													onClick={() => openEdit(product)}
													aria-label={`Edit ${product.name}`}
												>
													<Pencil className="size-4" />
													Edit
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => {
														setActionError("");
														setPendingDelete(product);
													}}
													aria-label={`Delete ${product.name}`}
												>
													<Trash2 className="size-4" />
												</Button>
											</div>
										) : null}
									</div>
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
				title="Delete this product?"
				description={
					pendingDelete ? (
						<>
							<span className="font-medium">{pendingDelete.name}</span> will be permanently removed
							from your catalogue. This action cannot be undone.
						</>
					) : null
				}
				confirmLabel="Delete product"
				onConfirm={handleConfirmDelete}
				loading={deleting}
			/>
		</div>
	);
}
