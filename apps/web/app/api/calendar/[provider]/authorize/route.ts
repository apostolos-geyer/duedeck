import { buildAuthorizationUrl, isValidProvider } from "@repo/app/lib/calendar";
import { auth } from "@repo/auth/server";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;

	if (!isValidProvider(provider)) {
		return NextResponse.redirect(new URL("/settings?calendar=error&message=invalid_provider", request.url));
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	const state = randomBytes(32).toString("hex");
	const authUrl = buildAuthorizationUrl(provider, state);

	const response = NextResponse.redirect(authUrl);
	response.cookies.set("calendar_oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 600,
		path: "/",
	});

	return response;
}
