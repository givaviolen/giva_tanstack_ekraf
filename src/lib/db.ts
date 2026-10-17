import { memoryAdapter } from "better-auth/adapters/memory";

import type { ProductCategory } from "./catalog";

export type Role = "admin" | "user";

// Re-exported for server-side callers. Client code should import from
// `@/lib/catalog` directly so the Better Auth adapter stays out of the bundle.
export { PRODUCT_CATEGORIES, type ProductCategory } from "./catalog";

export interface Product {
	id: string;
	name: string;
	/** Name of the UMKM / artisan that produces the item. */
	umkm: string;
	category: ProductCategory;
	description: string;
	/** Price in Indonesian Rupiah (whole rupiah). */
	price: number;
	stock: number;
	/** An external image URL or a downscaled `data:` URL. `null` when unset. */
	image: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface UserRole {
	userId: string;
	role: Role;
}

/**
 * In-memory development database.
 *
 * better-auth owns the `user`, `session`, `account` and `verification` tables
 * (managed through `memoryAdapter`). This app adds `product` and `userRole`.
 *
 * NOTE: this is memory only. Data survives within a single running server
 * process (local dev, or one warmed Vercel serverless instance) but is reset
 * on every redeploy / cold start. There is no persistent database by design.
 * See AGENTS.md for how to seed an admin account and sample data.
 */
const memoryDb = {
	user: [] as Array<{
		id: string;
		email: string;
		name: string | null;
		image: string | null;
		emailVerified: boolean;
		emailVerifiedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
		lastSignInAt: Date | null;
	}>,
	session: [] as unknown[],
	account: [] as unknown[],
	verification: [] as unknown[],
	product: [] as Product[],
	userRole: [] as UserRole[],
};

export const adapter = memoryAdapter(memoryDb);
export const db = memoryDb;

export const SEED_ADMIN_EMAIL = "admin@example.com";
export const SEED_ADMIN_PASSWORD = "admin12345";

/** Sample Lake Toba UMKM products created by the one-time `/setup` seed. */
export const SEED_PRODUCTS: ReadonlyArray<
	Pick<Product, "name" | "umkm" | "category" | "description" | "price" | "stock">
> = [
	{
		name: "Ulos Ragidup",
		umkm: "Tenun Sianipar",
		category: "Kain Ulos",
		description:
			"Kain ulos tenun tangan motif ragidup, simbol restu dan panjang umur. Pewarna alam, dibuat oleh penenun di Samosir.",
		price: 1_250_000,
		stock: 8,
	},
	{
		name: "Kopi Lintong Arabika 500g",
		umkm: "Koperasi Tani Lintong",
		category: "Kopi",
		description:
			"Arabika Lintong single origin, body tebal dengan sentuhan cokelat dan rempah. Digiling sesuai pesanan.",
		price: 95_000,
		stock: 120,
	},
	{
		name: "Kacang Sihobuk Bawang 250g",
		umkm: "UD Sihobuk Jaya",
		category: "Kuliner",
		description:
			"Kacang tanah sangrai khas Sihobuk dengan bumbu bawang gurih. Camilan wajib oleh-oleh kawasan Danau Toba.",
		price: 32_000,
		stock: 200,
	},
	{
		name: "Ukiran Kayu Patung Sigale-gale",
		umkm: "Sanggar Ukir Tomok",
		category: "Kerajinan",
		description:
			"Patung kayu ukir tangan bermotif gorga Batak, dikerjakan pengrajin Tomok dari kayu ingul.",
		price: 675_000,
		stock: 14,
	},
	{
		name: "Tas Anyaman Pandan Samosir",
		umkm: "Kelompok Wanita Samosir",
		category: "Aksesori",
		description:
			"Tas anyaman pandan ramah lingkungan dengan aksen kain ulos, cocok untuk oleh-oleh dan penggunaan harian.",
		price: 185_000,
		stock: 3,
	},
	{
		name: "Sambal Andaliman Botol 200g",
		umkm: "Dapur Batak Nauli",
		category: "Kuliner",
		description:
			"Sambal andaliman segar khas Batak, pedas menyengat dengan aroma jeruk purut. Tanpa pengawet.",
		price: 45_000,
		stock: 60,
	},
];

export function getUserRole(userId: string): Role {
	return db.userRole.find((r) => r.userId === userId)?.role ?? "user";
}

export function setUserRole(userId: string, role: Role) {
	const existing = db.userRole.find((r) => r.userId === userId);
	if (existing) {
		existing.role = role;
	} else {
		db.userRole.push({ userId, role });
	}
}

export function removeUserRole(userId: string) {
	db.userRole = db.userRole.filter((r) => r.userId !== userId);
}

/**
 * Remove an account and everything tied to it.
 *
 * Deleting only the `user` row would leave live `session` rows behind: a stolen
 * or cached session cookie could still be resolved until it expired. Purging
 * sessions (and accounts/verifications) alongside the user guarantees the
 * deletion takes effect immediately.
 */
export function purgeUser(userId: string) {
	db.user = db.user.filter((u) => u.id !== userId);
	db.account = db.account.filter((row) => (row as { userId?: string }).userId !== userId);
	db.session = db.session.filter((row) => (row as { userId?: string }).userId !== userId);
	db.verification = db.verification.filter((row) => (row as { userId?: string }).userId !== userId);
	removeUserRole(userId);
}

export function countAdmins() {
	return db.userRole.filter((r) => r.role === "admin").length;
}
