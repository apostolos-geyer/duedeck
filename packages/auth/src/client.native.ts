import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const COOKIE_KEY = "better_auth_cookie";

const authClient = createAuthClient({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	fetch: async (input, init) => {
		const headers = new Headers(init?.headers);
		const cookie = SecureStore.getItem(COOKIE_KEY);
		if (cookie) {
			headers.set("cookie", cookie);
		}
		const res = await globalThis.fetch(input, { ...init, headers });
		const setCookie = res.headers.get("set-cookie");
		if (setCookie) {
			SecureStore.setItem(COOKIE_KEY, setCookie);
		}
		return res;
	},
});

export const { signIn, signUp, signOut, useSession } = authClient;
export { COOKIE_KEY };
