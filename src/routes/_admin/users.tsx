import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	createColumnHelper,
	flexRender,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { Search, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SortIndicator } from "@/components/common/SortIndicator";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type RoleUser, UserRoleModal } from "@/components/users/UserRoleModal";
import { formatDate, initials } from "@/lib/format";
import { deleteUser, getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/_admin/users")({
	beforeLoad: ({ context }) => {
		if (context.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({
		meta: [{ title: "Users — Ekraf" }],
	}),
	component: UsersPage,
});

interface UserRow extends RoleUser {
	emailVerified: boolean;
	createdAt: string;
}

const features = tableFeatures({ rowSortingFeature });
const columnHelper = createColumnHelper<typeof features, UserRow>();

function RoleBadge({ role }: { role: UserRow["role"] }) {
	if (role === "admin") {
		return (
			<Badge variant="default" className="gap-1">
				<ShieldCheck className="size-3" />
				Admin
			</Badge>
		);
	}
	return (
		<Badge variant="secondary" className="gap-1">
			<UserRound className="size-3" />
			User
		</Badge>
	);
}

function UsersPage() {
	const { viewer } = Route.useRouteContext();
	const queryClient = useQueryClient();
	const usersQuery = useQuery({
		queryKey: ["users"],
		queryFn: async () => getUsers(),
	});
	const deleteFn = useServerFn(deleteUser);

	const [search, setSearch] = useState("");
	const [roleUser, setRoleUser] = useState<RoleUser | null>(null);
	const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [actionError, setActionError] = useState("");

	const users: UserRow[] = usersQuery.data ?? [];
	const adminCount = users.filter((user) => user.role === "admin").length;
	const query = search.trim().toLowerCase();
	const filtered = query
		? users.filter(
				(user) =>
					(user.name?.toLowerCase().includes(query) ?? false) ||
					user.email.toLowerCase().includes(query),
			)
		: users;

	const refresh = () => queryClient.invalidateQueries({ queryKey: ["users"] });

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		setDeleting(true);
		setActionError("");
		try {
			await deleteFn({ data: { userId: pendingDelete.id } });
			await refresh();
			setPendingDelete(null);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Could not delete the user");
		} finally {
			setDeleting(false);
		}
	};

	const labelFor = (user: UserRow) => user.name?.trim() || user.email;

	const columns = columnHelper.columns([
		columnHelper.accessor("name", {
			header: "Account",
			cell: (info) => {
				const user = info.row.original;
				const isSelf = user.id === viewer.id;
				return (
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="flex items-center gap-2 truncate text-sm font-semibold">
								<span className="truncate">{user.name?.trim() || "Unnamed user"}</span>
								{isSelf ? (
									<span className="text-muted-foreground shrink-0 text-xs font-normal">(you)</span>
								) : null}
							</p>
							<p className="text-muted-foreground truncate text-xs">{user.email}</p>
						</div>
					</div>
				);
			},
		}),
		columnHelper.accessor("role", {
			header: "Role",
			cell: (info) => <RoleBadge role={info.getValue()} />,
		}),
		columnHelper.accessor("emailVerified", {
			header: "Status",
			cell: (info) =>
				info.getValue() ? (
					<Badge variant="success">Verified</Badge>
				) : (
					<Badge variant="outline">Unverified</Badge>
				),
		}),
		columnHelper.accessor("createdAt", {
			header: "Joined",
			cell: (info) => (
				<span className="text-muted-foreground text-xs">{formatDate(String(info.getValue()))}</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: (info) => {
				const user = info.row.original;
				const isSelf = user.id === viewer.id;
				const isLastAdmin = user.role === "admin" && adminCount <= 1;
				return (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								setActionError("");
								setRoleUser(user);
							}}
							disabled={isSelf}
							title={isSelf ? "You cannot change your own role" : "Change role"}
							aria-label={`Change role for ${labelFor(user)}`}
						>
							<ShieldCheck className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-destructive hover:text-destructive"
							onClick={() => {
								setActionError("");
								setPendingDelete(user);
							}}
							disabled={isSelf || isLastAdmin}
							title={
								isSelf
									? "You cannot delete your own account"
									: isLastAdmin
										? "You cannot delete the last administrator"
										: "Delete user"
							}
							aria-label={`Delete ${labelFor(user)}`}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				);
			},
		}),
	]);

	const table = useTable({
		features,
		columns,
		data: filtered,
	});

	const hasUsers = users.length > 0;
	const isEmpty = !usersQuery.isPending && filtered.length === 0;

	return (
		<div className="space-y-6">
			{actionError ? (
				<Alert variant="destructive">
					<AlertDescription>{actionError}</AlertDescription>
				</Alert>
			) : null}

			<Card className="overflow-hidden py-0">
				{/* Toolbar */}
				<div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<div className="min-w-0">
						<h2 className="text-base font-semibold tracking-tight">Accounts</h2>
						<p className="text-muted-foreground text-xs">
							{usersQuery.isPending
								? "Loading accounts…"
								: query
									? `${filtered.length} of ${users.length} account${users.length === 1 ? "" : "s"}`
									: `${users.length} account${users.length === 1 ? "" : "s"} · ${adminCount} admin${
											adminCount === 1 ? "" : "s"
										}`}
						</p>
					</div>

					<div className="relative w-full sm:w-64">
						<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search by name or email…"
							className="h-9 pl-9"
							aria-label="Search users"
						/>
					</div>
				</div>

				{/* Content */}
				{usersQuery.isPending ? (
					<div className="p-6">
						<LoadingState rows={5} label="Loading accounts" />
					</div>
				) : usersQuery.isError ? (
					<ErrorState
						title="We couldn't load your accounts"
						description={(usersQuery.error as Error)?.message}
						onRetry={() => void usersQuery.refetch()}
						className="m-6"
					/>
				) : isEmpty ? (
					<div className="p-6">
						<EmptyState
							icon={Users}
							title={hasUsers ? "No matching accounts" : "No accounts yet"}
							description={
								hasUsers
									? "Try a different search term to find the account you're looking for."
									: "Accounts appear here once people sign up."
							}
						/>
					</div>
				) : (
					<>
						{/* Desktop table */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									{table.getHeaderGroups().map((headerGroup) => (
										<TableRow key={headerGroup.id} className="hover:bg-transparent">
											{headerGroup.headers.map((header) => (
												<TableHead key={header.id} colSpan={header.colSpan}>
													{header.isPlaceholder ? null : header.column.getCanSort() ? (
														<button
															type="button"
															onClick={header.column.getToggleSortingHandler()}
															className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 uppercase transition-colors"
														>
															{flexRender(header.column.columnDef.header, header.getContext())}
															<SortIndicator sorted={header.column.getIsSorted()} />
														</button>
													) : (
														flexRender(header.column.columnDef.header, header.getContext())
													)}
												</TableHead>
											))}
										</TableRow>
									))}
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getAllCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Mobile cards */}
						<ul className="divide-y md:hidden">
							{filtered.map((user) => {
								const isSelf = user.id === viewer.id;
								const isLastAdmin = user.role === "admin" && adminCount <= 1;
								return (
									<li key={user.id} className="space-y-3 p-4">
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold">
													{user.name?.trim() || "Unnamed user"}
													{isSelf ? (
														<span className="text-muted-foreground ml-1 text-xs font-normal">
															(you)
														</span>
													) : null}
												</p>
												<p className="text-muted-foreground truncate text-xs">{user.email}</p>
											</div>
											<RoleBadge role={user.role} />
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground text-xs">
												Joined {formatDate(user.createdAt)}
											</span>
											<div className="flex items-center gap-1">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setActionError("");
														setRoleUser(user);
													}}
													disabled={isSelf}
												>
													<ShieldCheck className="size-4" />
													Role
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-destructive hover:text-destructive"
													onClick={() => {
														setActionError("");
														setPendingDelete(user);
													}}
													disabled={isSelf || isLastAdmin}
													aria-label={`Delete ${labelFor(user)}`}
												>
													<Trash2 className="size-4" />
												</Button>
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					</>
				)}
			</Card>

			<UserRoleModal
				open={Boolean(roleUser)}
				onOpenChange={(open) => {
					if (!open) setRoleUser(null);
				}}
				user={roleUser}
				isSelf={Boolean(roleUser && roleUser.id === viewer.id)}
				onSaved={() => setRoleUser(null)}
			/>

			<ConfirmDialog
				open={Boolean(pendingDelete)}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null);
				}}
				title="Delete this account?"
				description={
					pendingDelete ? (
						<>
							<span className="font-medium">{labelFor(pendingDelete)}</span> will lose access
							immediately and be removed from the workspace. This action cannot be undone.
						</>
					) : null
				}
				confirmLabel="Delete account"
				onConfirm={handleConfirmDelete}
				loading={deleting}
			/>
		</div>
	);
}
