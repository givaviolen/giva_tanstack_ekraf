import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Field } from "@/components/common/Field";
import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/register")({
	head: () => ({
		meta: [{ title: "Daftar — UKM Danau Toba" }],
	}),
	component: RegisterPage,
});

interface RegisterErrors {
	name?: string;
	email?: string;
	password?: string;
	confirm?: string;
	terms?: string;
}

function RegisterPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [terms, setTerms] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [errors, setErrors] = useState<RegisterErrors>({});
	const [loading, setLoading] = useState(false);

	const clearError = (key: keyof RegisterErrors) =>
		setErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));

	const validate = (): RegisterErrors => {
		
		const next: RegisterErrors = {};
		if (!name.trim()) next.name = "Nama wajib diisi";
		else if (name.trim().length < 2) next.name = "Nama minimal 2 karakter";

		if (!email.trim()) next.email = "Email wajib diisi";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
			next.email = "Format email tidak valid";

if (!password) next.password = "Password wajib diisi";
else if (password.length < 8) next.password = "Password minimal 8 karakter";

		if (!confirm) next.confirm = "Konfirmasi password wajib diisi";
		else if (confirm !== password) next.confirm = "Password tidak sama";

		if (!terms) next.terms = "Setujui ketentuan untuk melanjutkan";

		return next;
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError("");

		const validationErrors = validate();
		setErrors(validationErrors);
		if (Object.values(validationErrors).some(Boolean)) return;

		setLoading(true);
		try {
			const result = await authClient.signUp.email({
				email: email.trim(),
				password,
				name: name.trim(),
			});
			if (result.error) {
				setError(result.error.message || "Tidak dapat membuat akun");
				return;
			}
			await navigate({ to: "/dashboard" });
		} catch {
			setError("Terjadi kesalahan. Silakan coba lagi.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthCard
			icon={UserPlus}
			title="Buat akun baru"
			description="Daftar dalam sekejap. Peran admin dapat diberikan kemudian."
			footer={
				<p className="text-muted-foreground text-sm">
					Sudah punya akun?{" "}
					<Link to="/login" className="text-primary font-semibold hover:underline">
						Masuk
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-5" noValidate>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<Field label="Nama lengkap" htmlFor="name" required error={errors.name}>
					<div className="relative">
						<User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							id="name"
							autoComplete="name"
							value={name}
							onChange={(event) => {
								setName(event.target.value);
								clearError("name");
							}}
							placeholder="Nama Anda"
							className="pl-9"
							aria-invalid={Boolean(errors.name)}
						/>
					</div>
				</Field>

				<Field label="Email" htmlFor="email" required error={errors.email}>
					<div className="relative">
						<Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							id="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(event) => {
								setEmail(event.target.value);
								clearError("email");
							}}
							placeholder="admin@example.com"
							className="pl-9"
							aria-invalid={Boolean(errors.email)}
						/>
					</div>
				</Field>

				<Field label="Password" htmlFor="password" required error={errors.password}>
					<div className="relative">
						<LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							value={password}
							onChange={(event) => {
								setPassword(event.target.value);
								clearError("password");
							}}
							placeholder="Minimal 8 karakter"
							className="pr-10 pl-9"
							aria-invalid={Boolean(errors.password)}
						/>
						<button
							type="button"
							onClick={() => setShowPassword((value) => !value)}
							className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
							aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
						>
							{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
						</button>
					</div>
					<PasswordStrength password={password} />
				</Field>

				<Field label="Confirm password" htmlFor="confirm" required error={errors.confirm}>
					<div className="relative">
						<LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							id="confirm"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							value={confirm}
							onChange={(event) => {
								setConfirm(event.target.value);
								clearError("confirm");
							}}
							placeholder="Masukkan ulang password"
							className="pl-9"
							aria-invalid={Boolean(errors.confirm)}
						/>
					</div>
				</Field>

				<div className="space-y-1.5">
					<div className="flex items-start gap-2.5">
						<Checkbox
							id="terms"
							checked={terms}
							onCheckedChange={(checked) => {
								setTerms(checked === true);
								clearError("terms");
							}}
							className="mt-0.5"
							aria-invalid={Boolean(errors.terms)}
						/>
						<Label htmlFor="terms" className="text-muted-foreground font-normal leading-snug">
							Saya menyetujui ketentuan layanan dan kebijakan privasi.
						</Label>
					</div>
					{errors.terms ? (
						<p className="text-destructive text-xs font-medium" role="alert">
							{errors.terms}
						</p>
					) : null}
				</div>

				<Button type="submit" size="lg" className="w-full" disabled={loading}>
					{loading ? <Spinner /> : <UserPlus className="size-4.5" />}
					{loading ? "Membuat akun…" : "Buat akun"}
				</Button>
			</form>
		</AuthCard>
	);
}
