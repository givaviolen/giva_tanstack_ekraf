import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { countAdmins, db, getUserRole, purgeUser, setUserRole } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { safeValidator } from "@/lib/server/guard";
import { requireAdmin } from "@/lib/session";

export const userRoleSchema = z.object({
	userId: z.string().min(1, "ID pengguna wajib diisi"),
	role: z.enum(["admin", "user"], { message: "Role tidak dikenal" }),
});

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	await requireAdmin();
	return db.user.map((u) => ({
		id: u.id,
		email: u.email,
		name: u.name,
		role: getUserRole(u.id),
		emailVerified: !!u.emailVerified,
		createdAt: u.createdAt.toISOString(),
	}));
});

export const updateUserRole = createServerFn({ method: "POST" })
	.validator(safeValidator(userRoleSchema, "Data role tidak valid"))
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();

		// Privilege-escalation guard 1: an admin must never be able to demote
		// themselves and leave the workspace without an owner.
		if (data.userId === user.id && data.role !== "admin") {
			throw new AppError("Anda tidak dapat menurunkan role akun Anda sendiri.", 400);
		}

		const target = db.user.find((u) => u.id === data.userId);
		if (!target) {
			throw notFound("Pengguna tidak ditemukan.");
		}

		// Privilege-escalation guard 2: never leave the app with zero admins.
		const currentRole = getUserRole(data.userId);
		if (currentRole === "admin" && data.role !== "admin" && countAdmins() <= 1) {
			throw new AppError("Tidak dapat menurunkan administrator terakhir.", 400);
		}

		setUserRole(data.userId, data.role);
		return { ok: true };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.validator(safeValidator(z.object({ userId: z.string().min(1, "ID pengguna wajib diisi") })))
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();

		// Privilege-escalation guard 1: no self-deletion.
		if (data.userId === user.id) {
			throw new AppError("Anda tidak dapat menghapus akun Anda sendiri.", 400);
		}

		const target = db.user.find((u) => u.id === data.userId);
		if (!target) {
			throw notFound("Pengguna tidak ditemukan.");
		}

		// Privilege-escalation guard 2: keep at least one administrator.
		if (getUserRole(data.userId) === "admin" && countAdmins() <= 1) {
			throw new AppError("Tidak dapat menghapus administrator terakhir.", 400);
		}

		// Deleting the row alone would leave live sessions for the removed
		// account, so purge the user together with their sessions/accounts.
		purgeUser(data.userId);
		return { ok: true };
	});
