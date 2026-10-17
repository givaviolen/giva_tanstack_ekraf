import { Link } from "@tanstack/react-router";

import { Brand } from "./layout/Brand";

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-border/70 bg-background/60">
			<div className="page-wrap flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
				<div className="flex flex-col items-center gap-3 sm:items-start">
					<Brand to="/" />
					<p className="text-muted-foreground max-w-sm text-center text-sm sm:text-left">
						Secure product and user administration built with TanStack Start and Better Auth.
					</p>
				</div>

				<div className="flex flex-col items-center gap-2 text-sm sm:items-end">
					<div className="flex items-center gap-4">
						<Link
							to="/login"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Sign in
						</Link>
						<Link
							to="/register"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							Create account
						</Link>
					</div>
					<p className="text-muted-foreground text-xs">
						&copy; {year} Ekraf Dashboard. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
