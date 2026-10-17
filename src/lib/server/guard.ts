import type { z } from "zod";

import { AppError, firstIssueMessage } from "@/lib/errors";

/**
 * A Zod schema wrapped so that validation failures surface as a short,
 * user-facing message instead of a serialised `ZodError`.
 *
 * Security note: the parse still happens **server-side** inside the TanStack
 * Start validator. This wrapper only changes how the failure is reported.
 */
export function safeValidator<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	fallback?: string,
): { parse: (input: unknown) => z.infer<TSchema> } {
	return {
		parse: (input: unknown): z.infer<TSchema> => {
			const result = schema.safeParse(input);
			if (!result.success) {
				throw new AppError(firstIssueMessage(result.error, fallback), 422);
			}
			return result.data;
		},
	};
}

/**
 * Fixed-window, in-memory rate limiter.
 *
 * Because this project deliberately ships without a database, throttling is
 * kept in process memory. That is enough to blunt brute-force/credential
 * stuffing on a single instance; a distributed deployment would swap the store
 * for Redis/Upstash behind the same interface.
 */
interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitOptions {
	/** Maximum number of hits allowed inside the window. */
	max: number;
	/** Window size in milliseconds. */
	windowMs: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
	const now = Date.now();
	const bucket = buckets.get(key);

	// Opportunistic cleanup so the map cannot grow without bound.
	if (buckets.size > MAX_TRACKED_KEYS) {
		for (const [existingKey, existing] of buckets) {
			if (existing.resetAt <= now) buckets.delete(existingKey);
		}
	}

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + options.windowMs });
		return { allowed: true, remaining: options.max - 1, retryAfterSeconds: 0 };
	}

	if (bucket.count >= options.max) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
		};
	}

	bucket.count += 1;
	return { allowed: true, remaining: options.max - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Throw a 429 `AppError` when the caller exceeded the quota.
 * Returns the remaining allowance otherwise.
 */
export function enforceRateLimit(key: string, options: RateLimitOptions): number {
	const result = rateLimit(key, options);
	if (!result.allowed) {
		throw new AppError(
			`Terlalu banyak percobaan. Coba lagi dalam ${result.retryAfterSeconds} detik.`,
			429,
		);
	}
	return result.remaining;
}

/** Test/dev helper: clear all buckets. */
export function resetRateLimits() {
	buckets.clear();
}
