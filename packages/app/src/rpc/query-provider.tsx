"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrpcProvider } from "./orpc-context";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
		},
	});
}

// biome-ignore lint: any needed for generic orpc utils type
export function QueryProvider({ orpc, children }: { orpc?: any; children: React.ReactNode }) {
	const [queryClient] = useState(createQueryClient);

	const inner = (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);

	if (orpc) {
		return <OrpcProvider orpc={orpc}>{inner}</OrpcProvider>;
	}
	return inner;
}
