import { auth } from "@repo/auth/server";
import {
	exchangeCodeForTokens,
	fetchProviderEmail,
	encryptToken,
	isValidProvider,
} from "@repo/app/lib/calendar";
import { prisma } from "@repo/db";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");

	const settingsUrl = (params: string) =>
		new URL(`/settings?${params}`, request.url);

	if (error) {
		return NextResponse.redirect(
			settingsUrl(`calendar=error&message=${encodeURIComponent(error)}`),
		);
	}

	if (!isValidProvider(provider)) {
		return NextResponse.redirect(settingsUrl("calendar=error&message=invalid_provider"));
	}

	if (!code || !state) {
		return NextResponse.redirect(settingsUrl("calendar=error&message=missing_params"));
	}

	const storedState = request.cookies.get("calendar_oauth_state")?.value;
	if (!storedState || storedState !== state) {
		return NextResponse.redirect(settingsUrl("calendar=error&message=invalid_state"));
	}

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	try {
		const tokens = await exchangeCodeForTokens(provider, code);
		const userInfo = await fetchProviderEmail(provider, tokens.accessToken);

		const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

		await prisma.calendarConnection.upsert({
			where: {
				userId_provider: {
					userId: session.user.id,
					provider,
				},
			},
			create: {
				userId: session.user.id,
				provider,
				connected: true,
				email: userInfo.email,
				accessToken: encryptToken(tokens.accessToken),
				refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
				accessTokenExpiresAt: expiresAt,
				providerAccountId: userInfo.id,
				scope: tokens.scope,
			},
			update: {
				connected: true,
				email: userInfo.email,
				accessToken: encryptToken(tokens.accessToken),
				refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
				accessTokenExpiresAt: expiresAt,
				providerAccountId: userInfo.id,
				scope: tokens.scope,
			},
		});

		const response = NextResponse.redirect(settingsUrl("calendar=connected"));
		response.cookies.delete("calendar_oauth_state");
		return response;
	} catch (err) {
		console.error("Calendar OAuth callback error:", err);
		const message = err instanceof Error ? err.message : "unknown_error";
		const response = NextResponse.redirect(
			settingsUrl(`calendar=error&message=${encodeURIComponent(message)}`),
		);
		response.cookies.delete("calendar_oauth_state");
		return response;
	}
}
