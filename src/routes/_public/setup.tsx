import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, DatabaseZap, ExternalLink, KeyRound } from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/common/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedAdmin } from "@/lib/server/auth";

export const Route = createFileRoute("/_public/setup")({
	head: () => ({
		meta: [{ title: "Setup — Ekraf Dashboard" }],
	}),
	component: Setup,
});

type Status = "idle" | "loading" | "success" | "error";

function Setup() {
	const seedAdminFn = useServerFn(seedAdmin);
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState("");

	const handleSeed = async () => {
		setStatus("loading");
		setMessage("");
		try {
			const result = await seedAdminFn();
			setStatus("success");
			setMessage(
				result.alreadySeeded
					? "An administrator already exists — nothing to do."
					: "Administrator created and sample products seeded.",
			);
		} catch (error) {
			setStatus("error");
			setMessage(error instanceof Error ? error.message : "Seeding failed");
		}
	};

	return (
		<main className="page-wrap flex justify-center py-14 sm:py-20">
			<Card className="w-full max-w-xl">
				<CardHeader>
					<span className="bg-primary/10 text-primary mb-1 grid size-11 place-items-center rounded-xl">
						<DatabaseZap className="size-5" />
					</span>
					<CardTitle className="text-xl">Seed the admin account</CardTitle>
					<CardDescription>
						This app keeps data in memory, so run this once after every restart to create the
						administrator and a few sample products. Seeding is idempotent.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-5">
					<div className="bg-muted/50 rounded-xl border p-4">
						<p className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
							<KeyRound className="size-3.5" />
							Seed credentials
						</p>
						<dl className="grid gap-1 text-sm">
							<div className="flex items-center justify-between gap-4">
								<dt className="text-muted-foreground">Email</dt>
								<dd className="font-mono font-medium">admin@example.com</dd>
							</div>
							<div className="flex items-center justify-between gap-4">
								<dt className="text-muted-foreground">Password</dt>
								<dd className="font-mono font-medium">admin12345</dd>
							</div>
						</dl>
					</div>

					<Button onClick={handleSeed} disabled={status === "loading"} className="w-full sm:w-auto">
						{status === "loading" ? <Spinner /> : <DatabaseZap className="size-4" />}
						{status === "loading" ? "Seeding…" : "Seed admin account"}
					</Button>

					{message ? (
						<Alert variant={status === "error" ? "destructive" : "success"}>
							{status === "success" ? <CheckCircle2 /> : null}
							<AlertDescription>{message}</AlertDescription>
						</Alert>
					) : null}

					{status === "success" ? (
						<Button asChild variant="outline" className="w-full sm:w-auto">
							<Link to="/login">
								Continue to sign in
								<ExternalLink className="size-4" />
							</Link>
						</Button>
					) : null}

					<p className="text-muted-foreground text-sm">
						Already have an account?{" "}
						<Link to="/login" className="text-primary font-medium hover:underline">
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
