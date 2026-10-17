/**
 * Client-safe catalogue metadata.
 *
 * Kept separate from `src/lib/db.ts` on purpose: `db.ts` imports the
 * server-only Better Auth memory adapter, so pulling *values* from it into a
 * client component would drag that adapter into the browser bundle. Types are
 * fine (`import type` is erased), values are not.
 */

export const PRODUCT_CATEGORIES = [
	"Kain Ulos",
	"Kopi",
	"Kuliner",
	"Kerajinan",
	"Aksesori",
	"Lainnya",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Badge tone per category, used on the public directory and product tables. */
export function categoryBadgeClass(category: string) {
	switch (category) {
		case "Kain Ulos":
			return "border-destructive/30 bg-destructive/10 text-destructive";
		case "Kopi":
			return "border-accent-foreground/25 bg-accent text-accent-foreground";
		case "Kuliner":
			return "border-warning/30 bg-warning/15 text-warning-foreground dark:text-warning";
		case "Kerajinan":
			return "border-primary/25 bg-primary/10 text-primary";
		default:
			return "border-border bg-secondary text-secondary-foreground";
	}
}
