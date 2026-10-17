import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Field } from "@/components/common/Field";
import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_admin/profile")({
	head: () => ({ meta: [{ title: "Profil — UKM Danau Toba" }] }),
	component: ProfilePage,
});

type Notice = { kind: "ok" | "error"; text: string } | null;

function ProfilePage() {
	const { viewer, role } = Route.useRouteContext();
	const router = useRouter();

	const [name, setName] = useState(viewer.name ?? "");
	const [nameNotice, setNameNotice] = useState<Notice>(null);
	const [savingName, setSavingName] = useState(false);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [pwNotice, setPwNotice] = useState<Notice>(null);
	const [savingPw, setSavingPw] = useState(false);

	const saveName = async (event: React.FormEvent) => {
		event.preventDefault();
		setNameNotice(null);
		if (name.trim().length < 2) {
			setNameNotice({ kind: "error", text: "Nama minimal 2 karakter." });
			return;
		}
		setSavingName(true);
		try {
			const result = await authClient.updateUser({ name: name.trim() });
			if (result.error) {
				setNameNotice({ kind: "error", text: result.error.message || "Gagal menyimpan nama." });
				return;
			}
			setNameNotice({ kind: "ok", text: "Nama berhasil diperbarui." });
			await router.invalidate();
		} catch {
			setNameNotice({ kind: "error", text: "Terjadi kesalahan. Silakan coba lagi." });
		} finally {
			setSavingName(false);
		}
	};

	const savePassword = async (event: React.FormEvent) => {
		event.preventDefault();
		setPwNotice(null);
		if (!currentPassword || newPassword.length < 8) {
			setPwNotice({ kind: "error", text: "Isi password lama dan password baru (minimal 8 karakter)." });
			return;
		}
		setSavingPw(true);
		try {
			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (result.error) {
				setPwNotice({ kind: "error", text: result.error.message || "Gagal mengganti password." });
				return;
			}
			setCurrentPassword("");
			setNewPassword("");
			setPwNotice({ kind: "ok", text: "Password berhasil diganti." });
		} catch {
			setPwNotice({ kind: "error", text: "Terjadi kesalahan. Silakan coba lagi." });
		} finally {
			setSavingPw(false);
		}
	};

	return (
		<div className="mx-auto grid max-w-3xl gap-6">
			<Card>
				<CardHeader className="flex-row items-center gap-4">
					<Avatar>
						{viewer.image ? <AvatarImage src={viewer.image} alt="" /> : null}
						<AvatarFallback>{initials(viewer.name, viewer.email)}</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<CardTitle className="truncate">{viewer.name?.trim() || "Akun"}</CardTitle>
						<CardDescription className="truncate">{viewer.email}</CardDescription>
					</div>
					<Badge variant={role === "admin" ? "default" : "secondary"}>
						{role === "admin" ? "admin" : "pengguna"}
					</Badge>
				</CardHeader>
				<CardContent>
					<Button asChild variant="outline" size="sm">
						<Link to="/dashboard">Kembali ke dashboard</Link>
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Informasi akun</CardTitle>
					<CardDescription>Ubah nama yang ditampilkan di aplikasi.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={saveName} className="space-y-4" noValidate>
						{nameNotice ? (
							<Alert variant={nameNotice.kind === "error" ? "destructive" : "default"}>
								<AlertDescription>{nameNotice.text}</AlertDescription>
							</Alert>
						) : null}
						<Field label="Nama lengkap" htmlFor="profile-name">
							<Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
						</Field>
						<Field label="Email" htmlFor="profile-email" description="Email tidak dapat diubah.">
							<Input id="profile-email" value={viewer.email} disabled />
						</Field>
						<Button type="submit" disabled={savingName}>
							{savingName ? <Spinner /> : null}
							Simpan nama
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Ganti password</CardTitle>
					<CardDescription>Perangkat lain yang sedang masuk akan dikeluarkan.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={savePassword} className="space-y-4" noValidate>
						{pwNotice ? (
							<Alert variant={pwNotice.kind === "error" ? "destructive" : "default"}>
								<AlertDescription>{pwNotice.text}</AlertDescription>
							</Alert>
						) : null}
						<Field label="Password lama" htmlFor="current-password">
							<Input
								id="current-password"
								type="password"
								autoComplete="current-password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
							/>
						</Field>
						<Field label="Password baru" htmlFor="new-password" description="Minimal 8 karakter.">
							<Input
								id="new-password"
								type="password"
								autoComplete="new-password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
							/>
						</Field>
						<Button type="submit" disabled={savingPw}>
							{savingPw ? <Spinner /> : null}
							Ganti password
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}