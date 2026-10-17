import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardShell } from "@/components/layout/DashboardShell";
import type { Role } from "@/lib/db";
import { getServerSession } from "@/lib/server/auth";

export const Route = createFileRoute("/_admin")({
	beforeLoad: async () => {
		const { session, user, role } = await getServerSession();
		if (!session || !user) {
			throw redirect({ to: "/login" });
		}
		return {
			viewer: {
				id: user.id,
				name: user.name ?? null,
				email: user.email,
				image: user.image ?? null,
			},
			role: (role ?? "user") as Role,
		};
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { viewer, role } = Route.useRouteContext();

	return (
		<DashboardShell viewer={viewer} role={role}>
			<Outlet />
		</DashboardShell>
	);
}
