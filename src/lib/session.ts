import { getRequest } from "@tanstack/react-start/server";

import { auth } from "./auth";
import { type Role, getUserRole } from "./db";
import { forbidden, unauthorized } from "./errors";

/**
 * Read the current better-auth session from the incoming request.
 *
 * Must only be called from server code (server functions, API route handlers,
 * or TanStack Start loaders executed on the server) because it relies on
 * `getRequest()`.
 */
export async function getCurrentSession() {
	const request = getRequest();
	const result = await auth.api.getSession({
		headers: request.headers,
	});
	return {
		session: result?.session ?? null,
		user: result?.user ?? null,
	};
}

/**
 * Authorization guard for read endpoints. Re-reads the session on the server —
 * the client can never be trusted to assert who it is.
 */
export async function requireAuth() {
	const { session, user } = await getCurrentSession();
	if (!session || !user) {
		throw unauthorized();
	}
	return { session, user };
}

/**
 * Authorization guard for privileged mutations. Combines authentication with a
 * server-side role lookup so a tampered client cannot escalate itself.
 */
export async function requireAdmin() {
	const { user } = await requireAuth();
	const role: Role = await getUserRole(user.id);
	if (role !== "admin") {
		throw forbidden();
	}
	return { user };
}
