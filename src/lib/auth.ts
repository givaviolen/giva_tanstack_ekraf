import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { adapter } from "./db";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const isHttps = baseUrl.startsWith("https://");

export const auth = betterAuth({
	database: adapter,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 60 * 15,
		},
	},
	/**
	 * Brute-force protection.
	 *
	 * The in-memory store is deliberate: this project ships without a database,
	 * so throttling lives in process memory (per instance). Rules are tight on
	 * the credential endpoints and relaxed everywhere else. A horizontally
	 * scaled deployment would set `storage: "database"` or a Redis-backed
	 * secondary storage here.
	 */
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100,
		storage: "memory",
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 60, max: 5 },
			"/reset-password": { window: 60, max: 3 },
			"/forget-password": { window: 60, max: 3 },
		},
	},
	advanced: {
		// Cookies are marked `Secure` whenever the app is served over HTTPS.
		useSecureCookies: isHttps,
		defaultCookieAttributes: {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
		},
	},
	plugins: [tanstackStartCookies()],
});

export default auth;
