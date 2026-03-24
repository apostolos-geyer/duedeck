import { prisma } from "@repo/db";
import { decryptToken, encryptToken } from "./crypto";
import { refreshAccessToken } from "./oauth";

const REFRESH_SLACK_MS = 5 * 60 * 1000;

/** Returns a valid Google Calendar API access token, refreshing and persisting tokens when needed. */
export async function getGoogleAccessTokenForUser(userId: string): Promise<string> {
	const conn = await prisma.calendarConnection.findUnique({
		where: { userId_provider: { userId, provider: "google" } },
	});

	if (!conn?.connected || !conn.accessToken) {
		throw new Error("Google Calendar is not connected");
	}

	const expiresAt = conn.accessTokenExpiresAt?.getTime() ?? 0;
	const needsRefresh = Date.now() >= expiresAt - REFRESH_SLACK_MS;

	if (!needsRefresh) {
		return decryptToken(conn.accessToken);
	}

	if (!conn.refreshToken) {
		throw new Error("Google Calendar session expired; please reconnect");
	}

	const refreshPlain = decryptToken(conn.refreshToken);
	const tokens = await refreshAccessToken("google", refreshPlain);

	const newExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
	const updateData: {
		accessToken: string;
		accessTokenExpiresAt: Date;
		refreshToken?: string;
	} = {
		accessToken: encryptToken(tokens.accessToken),
		accessTokenExpiresAt: newExpiresAt,
	};
	if (tokens.refreshToken) {
		updateData.refreshToken = encryptToken(tokens.refreshToken);
	}

	await prisma.calendarConnection.update({
		where: { id: conn.id },
		data: updateData,
	});

	return tokens.accessToken;
}
