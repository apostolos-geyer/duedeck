"use client";

import { QueryProvider } from "@repo/app/rpc/query-provider";
import { ActiveRunProvider } from "@repo/app/contexts/active-run-context";
import { orpc } from "@/lib/rpc-client";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryProvider orpc={orpc}>
			<ActiveRunProvider>{children}</ActiveRunProvider>
		</QueryProvider>
	);
}
