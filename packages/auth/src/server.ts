import { prisma } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	plugins: [nextCookies()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
