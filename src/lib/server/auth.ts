import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
	type Role,
	SEED_ADMIN_EMAIL,
	SEED_ADMIN_PASSWORD,
	SEED_PRODUCTS,
	countAdmins,
	countProducts,
	findUserByEmail,
	getUserRole,
	insertProduct,
	setUserRole,
} from "@/lib/db";
import { enforceRateLimit, safeValidator } from "@/lib/server/guard";
import { getCurrentSession } from "@/lib/session";

/**
 * Server-only session lookup. Safe to call from TanStack Router `beforeLoad`
 * because server functions always execute on the server.
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
	const { session, user } = await getCurrentSession();
	if (!session || !user) {
		return { session: null, user: null, role: null as Role | null };
	}
	return { session, user, role: await getUserRole(user.id) };
});

/**
 * One-time seed: creates the administrator account and sample products.
 * Idempotent and rate-limited.
 */
export const seedAdmin = createServerFn({ method: "POST" })
	.validator(safeValidator(z.object({}).optional().default({})))
	.handler(async () => {
		enforceRateLimit("seed-admin", { max: 5, windowMs: 60_000 });

		if ((await countAdmins()) > 0) {
			return { ok: true, alreadySeeded: true, admin: SEED_ADMIN_EMAIL };
		}

		if (!(await findUserByEmail(SEED_ADMIN_EMAIL))) {
			await auth.api.signUpEmail({
				body: {
					email: SEED_ADMIN_EMAIL,
					password: SEED_ADMIN_PASSWORD,
					name: "Administrator",
				},
				headers: new Headers(),
			});
		}

		const adminUser = await findUserByEmail(SEED_ADMIN_EMAIL);
		if (adminUser) await setUserRole(adminUser.id, "admin");

		if ((await countProducts()) === 0) {
			for (const p of SEED_PRODUCTS) await insertProduct({ ...p, image: null });
		}

		return { ok: true, alreadySeeded: false, admin: SEED_ADMIN_EMAIL };
	});