"use client";

import { createContext, useContext } from "react";

// Use a generic type to avoid tight coupling to specific router type
// biome-ignore lint: any is needed for the context type
type OrpcUtils = any;

const OrpcContext = createContext<OrpcUtils | null>(null);

export function OrpcProvider({
	orpc,
	children,
}: {
	orpc: OrpcUtils;
	children: React.ReactNode;
}) {
	return <OrpcContext.Provider value={orpc}>{children}</OrpcContext.Provider>;
}

export function useOrpc() {
	const ctx = useContext(OrpcContext);
	if (!ctx) throw new Error("useOrpc must be used within <OrpcProvider>");
	return ctx;
}
