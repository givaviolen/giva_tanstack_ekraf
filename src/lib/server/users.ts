import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { countAdmins, getUserRole, listUsers, purgeUser, setUserRole, userExists } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { safeValidator } from "@/lib/server/guard";
import { requireAdmin } from "@/lib/session";

export const userRoleSchema = z.object({
	userId: z.string().min(1, "ID pengguna wajib diisi"),
	role: z.enum(["admin", "user"], { message: "Role tidak dikenal" }),
});

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	await requireAdmin();
	return listUsers();
});

export const updateUserRole = createServerFn({ method: "POST" })
	.validator(safeValidator(userRoleSchema, "Data role tidak valid"))
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();

		if (data.userId === user.id && data.role !== "admin") {
			throw new AppError("Anda tidak dapat menurunkan role akun Anda sendiri.", 400);
		}
		if (!(await userExists(data.userId))) throw notFound("Pengguna tidak ditemukan.");

		const currentRole = await getUserRole(data.userId);
		if (currentRole === "admin" && data.role !== "admin" && (await countAdmins()) <= 1) {
			throw new AppError("Tidak dapat menurunkan administrator terakhir.", 400);
		}

		await setUserRole(data.userId, data.role);
		return { ok: true };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.validator(safeValidator(z.object({ userId: z.string().min(1, "ID pengguna wajib diisi") })))
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();

		if (data.userId === user.id) throw new AppError("Anda tidak dapat menghapus akun Anda sendiri.", 400);
		if (!(await userExists(data.userId))) throw notFound("Pengguna tidak ditemukan.");
		if ((await getUserRole(data.userId)) === "admin" && (await countAdmins()) <= 1) {
			throw new AppError("Tidak dapat menghapus administrator terakhir.", 400);
		}

		await purgeUser(data.userId);
		return { ok: true };
	});