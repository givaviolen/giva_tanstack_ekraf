import { cn } from "cn";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
	return <Loader2 aria-hidden className={cn("size-4 animate-spin", className)} />;
}
