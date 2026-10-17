import { Pool } from "pg";

import type { ProductCategory } from "./catalog";

export type Role = "admin" | "user";
export { PRODUCT_CATEGORIES, type ProductCategory } from "./catalog";

export interface Product {
	id: string;
	name: string;
	umkm: string;
	category: ProductCategory;
	description: string;
	price: number;
	stock: number;
	image: string | null;
	createdAt: string;
	updatedAt: string;
}

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL belum diatur di environment variables.");
}

const g = globalThis as unknown as { __pgPool?: Pool };
export const pool = g.__pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
g.__pgPool = pool;

export const SEED_ADMIN_EMAIL = "admin@example.com";
export const SEED_ADMIN_PASSWORD = "admin12345";

export const SEED_PRODUCTS: ReadonlyArray<
	Pick<Product, "name" | "umkm" | "category" | "description" | "price" | "stock">
> = [
	{ name: "Ulos Ragidup", umkm: "Tenun Sianipar", category: "Kain Ulos", description: "Kain ulos tenun tangan motif ragidup, simbol restu dan panjang umur. Pewarna alam, dibuat oleh penenun di Samosir.", price: 1_250_000, stock: 8 },
	{ name: "Kopi Lintong Arabika 500g", umkm: "Koperasi Tani Lintong", category: "Kopi", description: "Arabika Lintong single origin, body tebal dengan sentuhan cokelat dan rempah. Digiling sesuai pesanan.", price: 95_000, stock: 120 },
	{ name: "Kacang Sihobuk Bawang 250g", umkm: "UD Sihobuk Jaya", category: "Kuliner", description: "Kacang tanah sangrai khas Sihobuk dengan bumbu bawang gurih. Camilan wajib oleh-oleh kawasan Danau Toba.", price: 32_000, stock: 200 },
	{ name: "Ukiran Kayu Patung Sigale-gale", umkm: "Sanggar Ukir Tomok", category: "Kerajinan", description: "Patung kayu ukir tangan bermotif gorga Batak, dikerjakan pengrajin Tomok dari kayu ingul.", price: 675_000, stock: 14 },
	{ name: "Tas Anyaman Pandan Samosir", umkm: "Kelompok Wanita Samosir", category: "Aksesori", description: "Tas anyaman pandan ramah lingkungan dengan aksen kain ulos, cocok untuk oleh-oleh dan penggunaan harian.", price: 185_000, stock: 3 },
	{ name: "Sambal Andaliman Botol 200g", umkm: "Dapur Batak Nauli", category: "Kuliner", description: "Sambal andaliman segar khas Batak, pedas menyengat dengan aroma jeruk purut. Tanpa pengawet.", price: 45_000, stock: 60 },
];

/* ---------- role ---------- */
export async function getUserRole(userId: string): Promise<Role> {
	const r = await pool.query<{ role: Role }>("select role from user_role where user_id = $1", [userId]);
	return r.rows[0]?.role ?? "user";
}

export async function setUserRole(userId: string, role: Role) {
	await pool.query(
		"insert into user_role (user_id, role) values ($1, $2) on conflict (user_id) do update set role = excluded.role",
		[userId, role],
	);
}

export async function countAdmins(): Promise<number> {
	const r = await pool.query<{ n: number }>("select count(*)::int as n from user_role where role = 'admin'");
	return r.rows[0].n;
}

/* ---------- user ---------- */
export async function findUserByEmail(email: string) {
	const r = await pool.query<{ id: string }>('select id from "user" where email = $1', [email]);
	return r.rows[0] ?? null;
}

export async function userExists(userId: string) {
	const r = await pool.query('select 1 from "user" where id = $1', [userId]);
	return r.rowCount === 1;
}

export async function listUsers() {
	const r = await pool.query<{
		id: string; email: string; name: string | null; emailVerified: boolean; createdAt: Date; role: Role | null;
	}>(
		`select u.id, u.email, u.name, u."emailVerified", u."createdAt", r.role
		 from "user" u left join user_role r on r.user_id = u.id
		 order by u."createdAt" desc`,
	);
	return r.rows.map((u) => ({
		id: u.id,
		email: u.email,
		name: u.name,
		role: (u.role ?? "user") as Role,
		emailVerified: !!u.emailVerified,
		createdAt: new Date(u.createdAt).toISOString(),
	}));
}

/** Hapus user beserta sesi & akunnya agar cookie lama langsung tidak berlaku. */
export async function purgeUser(userId: string) {
	await pool.query('delete from session where "userId" = $1', [userId]);
	await pool.query('delete from account where "userId" = $1', [userId]);
	await pool.query("delete from user_role where user_id = $1", [userId]);
	await pool.query('delete from "user" where id = $1', [userId]);
}

/* ---------- product ---------- */
interface ProductRow {
	id: string; name: string; umkm: string; category: ProductCategory; description: string;
	price: number; stock: number; image: string | null; created_at: Date; updated_at: Date;
}

const toProduct = (r: ProductRow): Product => ({
	id: r.id, name: r.name, umkm: r.umkm, category: r.category, description: r.description,
	price: r.price, stock: r.stock, image: r.image,
	createdAt: new Date(r.created_at).toISOString(),
	updatedAt: new Date(r.updated_at).toISOString(),
});

export type ProductFields = Pick<Product, "name" | "umkm" | "category" | "description" | "price" | "stock" | "image">;

export async function listProducts(limit?: number): Promise<Product[]> {
	const r = await pool.query<ProductRow>(
		`select * from product order by created_at desc ${limit ? "limit " + Math.trunc(limit) : ""}`,
	);
	return r.rows.map(toProduct);
}

export async function countProducts(): Promise<number> {
	const r = await pool.query<{ n: number }>("select count(*)::int as n from product");
	return r.rows[0].n;
}

export async function insertProduct(p: ProductFields): Promise<Product> {
	const r = await pool.query<ProductRow>(
		`insert into product (id, name, umkm, category, description, price, stock, image)
		 values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
		[crypto.randomUUID(), p.name, p.umkm, p.category, p.description, p.price, p.stock, p.image],
	);
	return toProduct(r.rows[0]);
}

export async function updateProductRow(id: string, p: ProductFields): Promise<Product | null> {
	const r = await pool.query<ProductRow>(
		`update product set name=$2, umkm=$3, category=$4, description=$5, price=$6, stock=$7, image=$8, updated_at=now()
		 where id=$1 returning *`,
		[id, p.name, p.umkm, p.category, p.description, p.price, p.stock, p.image],
	);
	return r.rows[0] ? toProduct(r.rows[0]) : null;
}

export async function deleteProductRow(id: string): Promise<boolean> {
	const r = await pool.query("delete from product where id = $1", [id]);
	return r.rowCount === 1;
}