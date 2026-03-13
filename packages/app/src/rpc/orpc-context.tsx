"use client";

import { createContext, useContext } from "react";
import type { createRpc } from "./client";

type OrpcUtils = ReturnType<typeof createRpc>["orpc"];

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
