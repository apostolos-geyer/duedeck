import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { Router } from "./router";

export function createRpc(url: string) {
	const link = new RPCLink({ url });
	const rpc = createORPCClient<RouterClient<Router>>(link);
	const orpc = createTanstackQueryUtils(rpc);
	return { rpc, orpc };
}
