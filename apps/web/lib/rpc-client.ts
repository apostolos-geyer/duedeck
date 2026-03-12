import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { router } from "@/app/api/rpc/router";

const link = new RPCLink({
	url:
		typeof window !== "undefined"
			? `${window.location.origin}/api/rpc`
			: "http://localhost:3000/api/rpc",
});

export const rpc = createORPCClient<RouterClient<typeof router>>(link);
