import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { type Product, db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/session";

/**
 * A downscaled 512px image is a few hundred KB as a base64 data URL, so this
 * ceiling comfortably fits one while rejecting anything obviously oversized.
 */
const MAX_IMAGE_LENGTH = 720_000;

function isAllowedImageSource(value: string) {
	if (value.startsWith("https://") || value.startsWith("http://")) return true;
	return /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

// Server-side validation is the source of truth; the client only mirrors it for UX.
export const imageSchema = z
	.string()
	.trim()
	.max(MAX_IMAGE_LENGTH, "Image is too large (max 512px)")
	.refine(
		(value) => value === "" || isAllowedImageSource(value),
		"Image must be an https URL or an uploaded image",
	);

export const productSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
	description: z
		.string()
		.trim()
		.min(1, "Description is required")
		.max(2000, "Description is too long"),
	price: z.coerce.number().min(0, "Price must be positive").max(1_000_000, "Price is too large"),
	stock: z.coerce
		.number()
		.int("Stock must be a whole number")
		.min(0, "Stock must be positive")
		.max(1_000_000, "Stock is too large"),
	image: imageSchema.default(""),
});

export type ProductInput = z.infer<typeof productSchema>;

// TanStack Start server functions support GET and POST only. Mutations use
// POST and encode the intended action in the validator/body.
export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
	await requireAuth();
	return [...db.product].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Product[];
});

export const createProduct = createServerFn({ method: "POST" })
	.validator(productSchema)
	.handler(async ({ data }) => {
		await requireAdmin();
		const now = new Date().toISOString();
		const product: Product = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description,
			price: data.price,
			stock: data.stock,
			image: data.image || null,
			createdAt: now,
			updatedAt: now,
		};
		db.product.push(product);
		return product;
	});

export const updateProduct = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			...productSchema.shape,
		}),
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		const index = db.product.findIndex((p) => p.id === data.id);
		if (index === -1) {
			const err = new Error("Product not found") as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		const now = new Date().toISOString();
		const updated: Product = {
			...db.product[index],
			name: data.name,
			description: data.description,
			price: data.price,
			stock: data.stock,
			image: data.image || null,
			updatedAt: now,
		};
		db.product[index] = updated;
		return updated;
	});

export const deleteProduct = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireAdmin();
		const index = db.product.findIndex((p) => p.id === data.id);
		if (index === -1) {
			const err = new Error("Product not found") as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		db.product.splice(index, 1);
		return { ok: true };
	});
