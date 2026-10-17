import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "cn";

import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/db";
import { toUserMessage } from "@/lib/errors";
import { initials } from "@/lib/format";
import { updateUserRole } from "@/lib/server/users";

export interface RoleUser {
	id: string;
	name: string | null;
	email: string;
	role: Role;
}

const ROLES: Array<{ value: Role; label: string; description: string; icon: typeof UserIcon }> = [
	{
		value: "user",
		label: "Pengguna",
		description: "Dapat melihat ringkasan dan katalog produk.",
		icon: UserIcon,
	},
	{
		value: "admin",
		label: "Administrator",
		description: "Akses penuh termasuk pengelolaan produk dan pengguna.",
		icon: ShieldCheck,
	},
];

export function UserRoleModal({
	open,
	onOpenChange,
	user,
	isSelf,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: RoleUser | null;
	isSelf?: boolean;
	onSaved: () => void;
}) {
	const updateRoleFn = useServerFn(updateUserRole);
	const queryClient = useQueryClient();
	const [role, setRole] = useState<Role>("user");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (user) setRole(user.role);
		setError("");
	}, [user]);

	if (!user) return null;

	const handleSave = async () => {
		setError("");
		setSaving(true);
		try {
			await updateRoleFn({ data: { userId: user.id, role } });
			await queryClient.invalidateQueries({ queryKey: ["users"] });
			onSaved();
			onOpenChange(false);
		} catch (err) {
			setError(toUserMessage(err, "Role tidak dapat diperbarui."));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Ubah role</DialogTitle>
					<DialogDescription>Tentukan izin yang dimiliki akun ini.</DialogDescription>
				</DialogHeader>

				<div className="bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
					<Avatar>
						<AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">{user.name?.trim() || "Tanpa nama"}</p>
						<p className="text-muted-foreground truncate text-xs">{user.email}</p>
					</div>
				</div>

				{isSelf ? (
					<Alert variant="warning">
						<AlertDescription>
							Anda tidak dapat mengubah role akun sendiri. Minta administrator lain untuk
							mengubahnya.
						</AlertDescription>
					</Alert>
				) : null}

				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<div className="space-y-2">
					<Label>Role</Label>
					<div className="grid gap-2">
						{ROLES.map((option) => {
							const Icon = option.icon;
							const selected = role === option.value;
							const disabled = Boolean(isSelf) && option.value !== "admin";
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setRole(option.value)}
									disabled={disabled}
									aria-pressed={selected}
									className={cn(
										"flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
										selected
											? "border-primary bg-primary/8 ring-1 ring-primary/30"
											: "hover:bg-accent/60",
									)}
								>
									<span
										className={cn(
											"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
											selected
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground",
										)}
									>
										<Icon className="size-4" />
									</span>
									<span className="space-y-0.5">
										<span className="block text-sm font-semibold">{option.label}</span>
										<span className="text-muted-foreground block text-xs">
											{option.description}
										</span>
									</span>
								</button>
							);
						})}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
						Batal
					</Button>
					<Button
						onClick={() => void handleSave()}
						disabled={saving || Boolean(isSelf) || role === user.role}
					>
						{saving ? <Spinner /> : null}
						Simpan role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
