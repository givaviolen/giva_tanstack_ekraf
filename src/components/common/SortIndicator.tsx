import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

/**
 * Visual state for a sortable table column. Matches the value returned by
 * TanStack Table's `column.getIsSorted()`.
 */
export function SortIndicator({ sorted }: { sorted: false | "asc" | "desc" }) {
	if (sorted === "asc") return <ArrowUp className="size-3.5 shrink-0" />;
	if (sorted === "desc") return <ArrowDown className="size-3.5 shrink-0" />;
	return <ArrowUpDown className="size-3.5 shrink-0 opacity-40" />;
}
