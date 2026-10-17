const idr = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

/** Format a whole-rupiah amount, e.g. `Rp1.250.000`. */
export function formatCurrency(value: number) {
	if (!Number.isFinite(value)) return "—";
	return idr.format(value);
}

/** Alias kept for readability in the UMKM domain. */
export const formatRupiah = formatCurrency;

export function formatNumber(value: number) {
	return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(value: string | Date) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("id-ID", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

export function formatDateTime(value: string | Date) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("id-ID", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export function initials(name?: string | null, fallback?: string | null) {
	const source = (name ?? "").trim() || (fallback ?? "").trim();
	if (!source) return "U";
	const parts = source.split(/[\s@._-]+/).filter(Boolean);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function truncate(value: string, max = 80) {
	return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
