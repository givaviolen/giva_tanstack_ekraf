import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import ThemeToggle from "@/components/ThemeToggle";
import { Brand } from "@/components/layout/Brand";
import { getServerSession } from "@/lib/server/auth";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (session) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	const year = new Date().getFullYear();

	return (
		<div className="relative flex min-h-dvh flex-col">
			<div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
				<Brand to="/" />
				<ThemeToggle />
			</div>

			<div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
				<div className="rise-in w-full max-w-md">
					<Outlet />
				</div>
			</div>

			<p className="text-muted-foreground px-4 pb-6 text-center text-xs">
				&copy; {year} Ekraf Dashboard · Secure admin access
			</p>
		</div>
	);
}
