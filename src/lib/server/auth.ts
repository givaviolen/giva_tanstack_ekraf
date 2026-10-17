import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
	type Role,
	SEED_ADMIN_EMAIL,
	SEED_ADMIN_PASSWORD,
	SEED_PRODUCTS,
	countAdmins,
	db,
	getUserRole,
} from "@/lib/db";
import { enforceRateLimit, safeValidator } from "@/lib/server/guard";
import { getCurrentSession } from "@/lib/session";

/**
 * Server-only session lookup. Safe to call from TanStack Router `beforeLoad`
 * (which runs on the client during client navigation) because server
 * functions always execute on the server.
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
	const { session, user } = await getCurrentSession();
	if (!session || !user) {
		return { session: null, user: null, role: null as Role | null };
	}
	return { session, user, role: getUserRole(user.id) };
});

/**
 * One-time development seed: creates the administrator account (password
 * hashed by Better Auth) and seeds sample Lake Toba UMKM products. Idempotent.
 *
 * Guarded by:
 *  - idempotency (returns early once an admin exists) so it cannot be re-run to
 *    overwrite credentials, and
 *  - a rate limit so a fresh instance cannot be spammed.
 */
export const seedAdmin = createServerFn({ method: "POST" })
	.validator(safeValidator(z.object({}).optional().default({})))
	.handler(async () => {
		enforceRateLimit("seed-admin", { max: 5, windowMs: 60_000 });

		if (countAdmins() > 0) {
			return { ok: true, alreadySeeded: true, admin: SEED_ADMIN_EMAIL };
		}

		await auth.api.signUpEmail({
			body: {
				email: SEED_ADMIN_EMAIL,
				password: SEED_ADMIN_PASSWORD,
				name: "Administrator",
			},
			headers: new Headers(),
		});

		const adminUser = db.user.find((u) => u.email === SEED_ADMIN_EMAIL);
		if (adminUser) {
			const existing = db.userRole.find((r) => r.userId === adminUser.id);
			if (existing) {
				existing.role = "admin";
			} else {
				db.userRole.push({ userId: adminUser.id, role: "admin" });
			}
		}

		const now = new Date().toISOString();
		db.product.push(
			...SEED_PRODUCTS.map((product) => ({
				id: crypto.randomUUID(),
				...product,
				image: null,
				createdAt: now,
				updatedAt: now,
			})),
		);

		return { ok: true, alreadySeeded: false, admin: SEED_ADMIN_EMAIL };
	});
