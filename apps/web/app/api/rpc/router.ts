import { createRouter } from "@repo/app/rpc/server";
import { auth } from "@repo/auth/server";
import { headers } from "next/headers";

export const router = createRouter(async () => {
	return auth.api.getSession({ headers: await headers() });
});
