import { AlertTriangle } from "lucide-react";
import type * as React from "react";

import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Konfirmasi",
	cancelLabel = "Batal",
	onConfirm,
	loading = false,
	destructive = true,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void | Promise<void>;
	loading?: boolean;
	destructive?: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md" showCloseButton={false}>
				<DialogHeader>
					<span
						className={
							destructive
								? "bg-destructive/12 text-destructive mb-1 grid size-10 place-items-center rounded-full"
								: "bg-primary/12 text-primary mb-1 grid size-10 place-items-center rounded-full"
						}
					>
						<AlertTriangle className="size-5" />
					</span>
					<DialogTitle>{title}</DialogTitle>
					{description ? <DialogDescription>{description}</DialogDescription> : null}
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
						{cancelLabel}
					</Button>
					<Button
						variant={destructive ? "destructive" : "default"}
						onClick={() => void onConfirm()}
						disabled={loading}
					>
						{loading ? <Spinner /> : null}
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
