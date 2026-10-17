import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Field } from "@/components/common/Field";
import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/login")({
	head: () => ({
		meta: [{ title: "Masuk — UKM Danau Toba" }],
	}),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError("");

		const nextErrors: { email?: string; password?: string } = {};
		if (!email.trim()) nextErrors.email = "Email wajib diisi";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
			nextErrors.email = "Format email tidak valid";
		if (!password) nextErrors.password = "Password wajib diisi";
		setFieldErrors(nextErrors);
		if (nextErrors.email || nextErrors.password) return;

		setLoading(true);
		try {
			const result = await authClient.signIn.email({
				email: email.trim(),
				password,
				rememberMe: remember,
			});
			if (result.error) {
				// 429 comes from the Better Auth rate limiter (see src/lib/auth.ts)
				// and must not be reported as a wrong password.
				if (result.error.status === 429) {
					setError("Terlalu banyak percobaan masuk. Coba lagi beberapa saat lagi.");
				} else {
					setError(result.error.message || "Email atau password salah.");
				}
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
			icon={LogIn}
			title="Masuk ke akun Anda"
			description="Kelola produk dan pengguna direktori UKM Danau Toba."
			footer={
				<p className="text-muted-foreground text-sm">
					Belum punya akun?{" "}
					<Link to="/register" className="text-primary font-semibold hover:underline">
						Daftar sekarang
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-5" noValidate>
				{error ? (
					<Alert variant="destructive" data-testid="login-error">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<Field label="Email" htmlFor="email" required error={fieldErrors.email}>
					<div className="relative">
						<Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							id="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(event) => {
								setEmail(event.target.value);
								if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
							}}
							placeholder="admin@example.com"
							className="pl-9"
							aria-invalid={Boolean(fieldErrors.email)}
						/>
					</div>
				</Field>

				<Field label="Password" htmlFor="password" required error={fieldErrors.password}>
					<div className="relative">
						<LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							value={password}
							onChange={(event) => {
								setPassword(event.target.value);
								if (fieldErrors.password)
									setFieldErrors((prev) => ({ ...prev, password: undefined }));
							}}
							placeholder="••••••••"
							className="pr-10 pl-9"
							aria-invalid={Boolean(fieldErrors.password)}
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
				</Field>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Checkbox
							id="remember"
							checked={remember}
							onCheckedChange={(checked) => setRemember(checked === true)}
						/>
						<Label htmlFor="remember" className="text-muted-foreground font-normal">
							Ingat saya
						</Label>
					</div>
					<Link
						to="/setup"
						className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
					>
						Butuh akun? Seed data
					</Link>
				</div>

				<Button type="submit" size="lg" className="w-full" disabled={loading}>
					{loading ? <Spinner /> : <LogIn className="size-4.5" />}
					{loading ? "Memproses…" : "Masuk"}
				</Button>
			</form>
		</AuthCard>
	);
}
