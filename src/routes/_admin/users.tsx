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
import { toUserMessage } from "@/lib/errors";
import { formatDate, initials } from "@/lib/format";
import { deleteUser, getUsers } from "@/lib/server/users";

export const Route = createFileRoute("/_admin/users")({
	beforeLoad: ({ context }) => {
		if (context.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({
		meta: [{ title: "Pengguna — UKM Danau Toba" }],
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
			Pengguna
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
			setActionError(toUserMessage(error, "Pengguna tidak dapat dihapus."));
		} finally {
			setDeleting(false);
		}
	};

	const labelFor = (user: UserRow) => user.name?.trim() || user.email;

	const columns = columnHelper.columns([
		columnHelper.accessor("name", {
			header: "Akun",
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
								<span className="truncate">{user.name?.trim() || "Tanpa nama"}</span>
								{isSelf ? (
									<span className="text-muted-foreground shrink-0 text-xs font-normal">(Anda)</span>
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
					<Badge variant="success">Terverifikasi</Badge>
				) : (
					<Badge variant="outline">Belum verifikasi</Badge>
				),
		}),
		columnHelper.accessor("createdAt", {
			header: "Bergabung",
			cell: (info) => (
				<span className="text-muted-foreground text-xs">{formatDate(String(info.getValue()))}</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: "Aksi",
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
							title={isSelf ? "Anda tidak dapat mengubah role sendiri" : "Ubah role"}
							aria-label={`Ubah role ${labelFor(user)}`}
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
									? "Anda tidak dapat menghapus akun sendiri"
									: isLastAdmin
										? "Anda tidak dapat menghapus administrator terakhir"
										: "Hapus pengguna"
							}
							aria-label={`Hapus ${labelFor(user)}`}
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
						<h2 className="text-base font-semibold tracking-tight">Akun</h2>
						<p className="text-muted-foreground text-xs">
							{usersQuery.isPending
								? "Memuat akun…"
								: query
									? `${filtered.length} dari ${users.length} akun`
									: `${users.length} akun · ${adminCount} admin`}
						</p>
					</div>

					<div className="relative w-full sm:w-64">
						<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Cari nama atau email…"
							className="h-9 pl-9"
							aria-label="Cari pengguna"
						/>
					</div>
				</div>

				{/* Konten */}
				{usersQuery.isPending ? (
					<div className="p-6">
						<LoadingState rows={5} label="Memuat akun" />
					</div>
				) : usersQuery.isError ? (
					<ErrorState
						title="Akun tidak dapat dimuat"
						description={toUserMessage(usersQuery.error)}
						onRetry={() => void usersQuery.refetch()}
						className="m-6"
					/>
				) : isEmpty ? (
					<div className="p-6">
						<EmptyState
							icon={Users}
							title={hasUsers ? "Tidak ada akun yang cocok" : "Belum ada akun"}
							description={
								hasUsers
									? "Coba kata kunci lain untuk menemukan akun yang dicari."
									: "Akun akan muncul di sini setelah pengguna mendaftar."
							}
						/>
					</div>
				) : (
					<>
						{/* Tabel desktop */}
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

						{/* Kartu mobile */}
						<ul className="divide-border divide-y md:hidden">
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
													{user.name?.trim() || "Tanpa nama"}
													{isSelf ? (
														<span className="text-muted-foreground ml-1 text-xs font-normal">
															(Anda)
														</span>
													) : null}
												</p>
												<p className="text-muted-foreground truncate text-xs">{user.email}</p>
											</div>
											<RoleBadge role={user.role} />
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground text-xs">
												Bergabung {formatDate(user.createdAt)}
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
													aria-label={`Hapus ${labelFor(user)}`}
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
				title="Hapus akun ini?"
				description={
					pendingDelete ? (
						<>
							<span className="font-medium">{labelFor(pendingDelete)}</span> akan langsung
							kehilangan akses dan dihapus dari workspace. Tindakan ini tidak dapat dibatalkan.
						</>
					) : null
				}
				confirmLabel="Hapus akun"
				onConfirm={handleConfirmDelete}
				loading={deleting}
			/>
		</div>
	);
}
