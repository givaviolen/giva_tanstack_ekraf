import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { pool } from "./db";

const baseUrl =
	process.env.BETTER_AUTH_URL ??
	(process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: "http://localhost:3000");
const isHttps = baseUrl.startsWith("https://");

export const auth = betterAuth({
	baseURL: baseUrl,
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: [baseUrl, ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])],
	database: pool,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: { enabled: true, maxAge: 60 * 15 },
	},
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
		useSecureCookies: isHttps,
		defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
	},
	plugins: [tanstackStartCookies()],
});

export default auth;