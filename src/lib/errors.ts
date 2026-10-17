import type { z } from "zod";

/**
 * Error type used across server functions. Carrying an explicit `status` lets
 * the client render an accurate message (401 vs 403 vs 400) while keeping the
 * message itself human readable.
 */
export class AppError extends Error {
	readonly status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = "AppError";
		this.status = status;
	}
}

export function unauthorized(message = "Anda harus masuk terlebih dahulu.") {
	return new AppError(message, 401);
}

export function forbidden(message = "Akses ditolak: hanya admin yang diizinkan.") {
	return new AppError(message, 403);
}

export function notFound(message = "Data tidak ditemukan.") {
	return new AppError(message, 404);
}

/**
 * Turn the first Zod issue into a short, user-facing sentence.
 *
 * Server functions validate with Zod. A raw `ZodError` serialises to a JSON
 * blob over the wire (`[{"origin":"number","code":"too_big",...}]`), which is
 * unusable in a UI. TanStack Start serialises a plain `Error` message as-is, so
 * routing validation through `safeValidator` keeps messages readable.
 */
export function firstIssueMessage(error: z.ZodError, fallback = "Data yang dikirim tidak valid.") {
	const issue = error.issues[0];
	if (!issue) return fallback;
	const field = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
	return `${field}${issue.message}`;
}

/**
 * Best-effort extraction of a readable message from any thrown value.
 *
 * Handles: `AppError`, plain `Error`, and the JSON-serialised Zod issue arrays
 * that can still reach the client from framework-level validation.
 */
export function toUserMessage(error: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
	if (error instanceof AppError) return error.message;

	if (error instanceof Error) {
		return extractZodMessage(error.message) ?? (error.message.trim() || fallback);
	}

	if (typeof error === "string") {
		return extractZodMessage(error) ?? (error.trim() || fallback);
	}

	return fallback;
}

function extractZodMessage(text: string): string | null {
	const trimmed = text.trim();
	if (!trimmed.startsWith("[")) return null;

	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (!Array.isArray(parsed)) return null;

		const messages = parsed
			.map((issue) => {
				if (typeof issue !== "object" || issue === null) return null;
				const record = issue as Record<string, unknown>;
				const message = typeof record.message === "string" ? record.message : null;
				if (!message) return null;
				const path =
					Array.isArray(record.path) && record.path.length > 0 ? record.path.join(".") : "";
				return path ? `${path}: ${message}` : message;
			})
			.filter((value): value is string => Boolean(value));

		const unique = [...new Set(messages)];
		return unique.length > 0 ? unique.join(", ") : null;
	} catch {
		return null;
	}
}
