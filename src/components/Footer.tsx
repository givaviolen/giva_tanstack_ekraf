import { Link } from "@tanstack/react-router";

import { Brand } from "./layout/Brand";

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-border/60 bg-background/60 border-t">
			<div className="page-wrap flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
				<div className="flex flex-col items-center gap-3 sm:items-start">
					<Brand to="/" />
					<p className="text-muted-foreground max-w-sm text-center text-sm sm:text-left">
						Direktori dan dashboard pengelolaan produk UKM kawasan Danau Toba — dari kain ulos
						hingga kopi Lintong.
					</p>
				</div>

				<div className="flex flex-col items-center gap-2 text-sm sm:items-end">
					<div className="flex items-center gap-4">
						<Link
							to="/produk"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Direktori Produk
						</Link>
						<Link
							to="/login"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Masuk
						</Link>
						<Link
							to="/register"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Daftar
						</Link>
					</div>
					<p className="text-muted-foreground text-xs">
						&copy; {year} UKM Danau Toba. Seluruh hak cipta dilindungi.
					</p>
				</div>
			</div>
			<div className="ulos-stripe h-1 w-full opacity-70" aria-hidden />
		</footer>
	);
}
