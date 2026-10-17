import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordStrength, scorePassword } from "@/components/auth/PasswordStrength";
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
		meta: [{ title: "Create account — Ekraf Dashboard" }],
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
		if (!name.trim()) next.name = "Name is required";
		else if (name.trim().length < 2) next.name = "Name must be at least 2 characters";

		if (!email.trim()) next.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
			next.email = "Enter a valid email address";

		if (!password) next.password = "Password is required";
		else if (password.length < 8) next.password = "Password must be at least 8 characters";
		else if (scorePassword(password) < 2)
			next.password = "Add a number or symbol to make it stronger";

		if (!confirm) next.confirm = "Please confirm your password";
		else if (confirm !== password) next.confirm = "Passwords do not match";

		if (!terms) next.terms = "Please accept the terms to continue";

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
				setError(result.error.message || "Could not create your account");
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
			icon={UserPlus}
			title="Create your account"
			description="Set up access in seconds. You can be promoted to admin later."
			footer={
				<p className="text-muted-foreground text-sm">
					Already have an account?{" "}
					<Link to="/login" className="text-primary font-semibold hover:underline">
						Sign in
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

				<Field label="Full name" htmlFor="name" required error={errors.name}>
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
							placeholder="Ada Lovelace"
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
							placeholder="you@example.com"
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
							placeholder="At least 8 characters"
							className="pr-10 pl-9"
							aria-invalid={Boolean(errors.password)}
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
							placeholder="Re-enter your password"
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
							I agree to the terms of service and privacy policy.
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
					{loading ? "Creating account…" : "Create account"}
				</Button>
			</form>
		</AuthCard>
	);
}
