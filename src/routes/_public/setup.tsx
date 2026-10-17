import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, DatabaseZap } from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toUserMessage } from "@/lib/errors";
import { seedAdmin } from "@/lib/server/auth";

export const Route = createFileRoute("/_public/setup")({
	head: () => ({
		meta: [{ title: "Setup Data — UKM Danau Toba" }],
	}),
	component: SetupPage,
});

function SetupPage() {
	const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	async function handleSeed() {
		setStatus("loading");
		setMessage("");
		setError("");
		try {
			const result = await seedAdmin();
			setMessage(
				result.alreadySeeded
					? "Data sudah pernah di-seed. Gunakan admin@example.com untuk masuk."
					: "Berhasil! Akun admin dan produk contoh telah dibuat. Silakan masuk dengan admin@example.com / admin12345.",
			);
			setStatus("done");
		} catch (caught) {
			setError(toUserMessage(caught));
			setStatus("idle");
		}
	}

	return (
		<div className="page-wrap flex min-h-[70vh] max-w-lg flex-col justify-center py-12">
			<Card className="border-border/70 shadow-xl shadow-primary/5">
				<CardHeader className="items-center gap-3 text-center">
					<span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
						<DatabaseZap className="size-6" />
					</span>
					<div className="space-y-1.5">
						<CardTitle className="text-2xl">Setup Data Awal</CardTitle>
						<CardDescription className="mx-auto max-w-sm text-balance">
							Aplikasi ini tidak memakai database persisten, jadi jalankan seed satu kali untuk
							membuat akun admin dan produk contoh kawasan Danau Toba.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="space-y-5">
					<ul className="text-muted-foreground space-y-1.5 text-sm">
						<li>
							• Akun:{" "}
							<code className="bg-muted rounded px-1.5 py-0.5 text-xs">admin@example.com</code>
						</li>
						<li>
							• Password: <code className="bg-muted rounded px-1.5 py-0.5 text-xs">admin12345</code>
						</li>
						<li>• 6 produk contoh (ulos, kopi Lintong, kacang Sihobuk, ukiran kayu, dll.)</li>
					</ul>

					{error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					{message ? (
						<Alert>
							<AlertDescription className="flex items-center gap-2">
								<CheckCircle2 className="size-4 shrink-0" />
								{message}
							</AlertDescription>
						</Alert>
					) : null}

					<div className="flex flex-wrap items-center gap-3">
						<Button onClick={handleSeed} disabled={status === "loading"}>
							{status === "loading" ? <Spinner /> : <DatabaseZap className="size-4" />}
							{status === "loading" ? "Menyiapkan…" : "Seed Data Admin & Produk"}
						</Button>
						{status === "done" ? (
							<Button asChild variant="outline">
								<Link to="/login">Ke halaman login</Link>
							</Button>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
