"use client";

import { QueryProvider } from "@repo/app/rpc/query-provider";
import { orpc } from "@/lib/rpc-client";

export function Providers({ children }: { children: React.ReactNode }) {
	return <QueryProvider orpc={orpc}>{children}</QueryProvider>;
}
