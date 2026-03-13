import { createRpc } from "@repo/app/rpc/client";

const url =
	typeof window !== "undefined"
		? `${window.location.origin}/api/rpc`
		: "http://localhost:3000/api/rpc";

export const { rpc, orpc } = createRpc(url);
