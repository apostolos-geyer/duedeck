import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { Router } from "@repo/app/rpc/server";
import * as SecureStore from "expo-secure-store";

const COOKIE_KEY = "better_auth_cookie";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const link = new RPCLink({
	url: `${BASE_URL}/api/rpc`,
	headers() {
		const cookie = SecureStore.getItem(COOKIE_KEY);
		return cookie ? { cookie } : {};
	},
});

const rpc = createORPCClient<RouterClient<Router>>(link);
export const orpc = createTanstackQueryUtils(rpc);
