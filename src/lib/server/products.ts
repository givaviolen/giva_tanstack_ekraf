import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PRODUCT_CATEGORIES } from "@/lib/catalog";
import {
	type Product,
	deleteProductRow,
	insertProduct,
	listProducts,
	updateProductRow,
} from "@/lib/db";
import { notFound } from "@/lib/errors";
import { safeValidator } from "@/lib/server/guard";
import { requireAdmin, requireAuth } from "@/lib/session";

/**
 * A downscaled 512px image is a few hundred KB as a base64 data URL, so this
 * ceiling comfortably fits one while rejecting anything obviously oversized.
 * Mirrored on the client in `src/lib/image.ts`.
 */
export const MAX_IMAGE_LENGTH = 720_000;

/** Rp 1 miliar — generous for handmade Ulos / carvings, still bounded. */
export const MAX_PRICE = 1_000_000_000;
export const MAX_STOCK = 1_000_000;

function isAllowedImageSource(value: string) {
	if (value.startsWith("https://") || value.startsWith("http://")) return true;
	return /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

// Server-side validation is the source of truth; the client only mirrors it for UX.
export const imageSchema = z
	.string()
	.trim()
	.max(MAX_IMAGE_LENGTH, "Ukuran gambar terlalu besar (maksimal 512px)")
	.refine(
		(value) => value === "" || isAllowedImageSource(value),
		"Gambar harus berupa tautan https atau hasil unggahan",
	);

export const productSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Nama produk wajib diisi")
		.max(120, "Nama produk maksimal 120 karakter"),
	umkm: z
		.string()
		.trim()
		.min(1, "Nama UMKM wajib diisi")
		.max(120, "Nama UMKM maksimal 120 karakter"),
	category: z.enum(PRODUCT_CATEGORIES, { message: "Kategori tidak dikenal" }),
	description: z
		.string()
		.trim()
		.min(1, "Deskripsi wajib diisi")
		.max(2000, "Deskripsi maksimal 2000 karakter"),
	price: z.coerce
		.number({ message: "Harga harus berupa angka" })
		.int("Harga harus bilangan bulat (rupiah)")
		.min(0, "Harga tidak boleh negatif")
		.max(MAX_PRICE, "Harga terlalu besar"),
	stock: z.coerce
		.number({ message: "Stok harus berupa angka" })
		.int("Stok harus bilangan bulat")
		.min(0, "Stok tidak boleh negatif")
		.max(MAX_STOCK, "Stok terlalu besar"),
	image: imageSchema.default(""),
});

export type ProductInput = z.infer<typeof productSchema>;

/** Shape exposed on the public landing page / directory. */
export interface PublicProduct {
	id: string;
	name: string;
	umkm: string;
	category: string;
	description: string;
	price: number;
	stock: number;
	image: string | null;
	createdAt: string;
	updatedAt: string;
}

function toPublicProduct(product: Product): PublicProduct {
	return {
		id: product.id,
		name: product.name,
		umkm: product.umkm,
		category: product.category,
		description: product.description,
		price: product.price,
		stock: product.stock,
		image: product.image,
		createdAt: product.createdAt,
		updatedAt: product.updatedAt,
	};
}


// TanStack Start server functions support GET and POST only. Mutations use
// POST and encode the intended action in the validator/body.
export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
	await requireAuth();
	return listProducts();
});

export const getPublicProducts = createServerFn({ method: "GET" })
	.validator(safeValidator(z.object({ limit: z.coerce.number().int().min(1).max(60).optional() }).optional()))
	.handler(async ({ data }): Promise<PublicProduct[]> => {
		const products = await listProducts(data?.limit ?? 60);
		return products.map(toPublicProduct);
	});

export const createProduct = createServerFn({ method: "POST" })
	.validator(safeValidator(productSchema, "Data produk tidak valid"))
	.handler(async ({ data }) => {
		await requireAdmin();
		return insertProduct({ ...data, image: data.image || null });
	});

export const updateProduct = createServerFn({ method: "POST" })
	.validator(
		safeValidator(
			z.object({ id: z.string().min(1, "ID produk wajib diisi"), ...productSchema.shape }),
			"Data produk tidak valid",
		),
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		const { id, ...fields } = data;
		const updated = await updateProductRow(id, { ...fields, image: fields.image || null });
		if (!updated) throw notFound("Produk tidak ditemukan.");
		return updated;
	});

export const deleteProduct = createServerFn({ method: "POST" })
	.validator(safeValidator(z.object({ id: z.string().min(1, "ID produk wajib diisi") })))
	.handler(async ({ data }) => {
		await requireAdmin();
		if (!(await deleteProductRow(data.id))) throw notFound("Produk tidak ditemukan.");
		return { ok: true };
	});