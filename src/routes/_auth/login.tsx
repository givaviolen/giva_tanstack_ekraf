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
		meta: [{ title: "Sign in — Ekraf Dashboard" }],
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
		if (!email.trim()) nextErrors.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
			nextErrors.email = "Enter a valid email address";
		if (!password) nextErrors.password = "Password is required";
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
				setError(result.error.message || "Invalid email or password");
				return;
			}
			await navigate({ to: "/dashboard" });
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthCard
			icon={LogIn}
			title="Welcome back"
			description="Sign in to manage your products and team."
			footer={
				<p className="text-muted-foreground text-sm">
					Don&apos;t have an account?{" "}
					<Link to="/register" className="text-primary font-semibold hover:underline">
						Create one
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
							placeholder="you@example.com"
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
							aria-label={showPassword ? "Hide password" : "Show password"}
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
							Remember me
						</Label>
					</div>
					<Link
						to="/setup"
						className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
					>
						Need an account?
					</Link>
				</div>

				<Button type="submit" size="lg" className="w-full" disabled={loading}>
					{loading ? <Spinner /> : <LogIn className="size-4.5" />}
					{loading ? "Signing in…" : "Sign in"}
				</Button>
			</form>
		</AuthCard>
	);
}
