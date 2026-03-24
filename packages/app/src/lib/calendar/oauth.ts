import {
	type CalendarProvider,
	getProviderConfig,
	getRedirectUri,
} from "./providers";

interface TokenResponse {
	accessToken: string;
	refreshToken: string | null;
	expiresIn: number;
	scope: string;
}

export function buildAuthorizationUrl(provider: CalendarProvider, state: string): string {
	const config = getProviderConfig(provider);
	const redirectUri = getRedirectUri(provider);

	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: config.scopes.join(" "),
		state,
	});

	if (provider === "google") {
		params.set("access_type", "offline");
		params.set("prompt", "consent");
	}

	if (provider === "microsoft") {
		params.set("response_mode", "query");
	}

	return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
	provider: CalendarProvider,
	code: string,
): Promise<TokenResponse> {
	const config = getProviderConfig(provider);
	const redirectUri = getRedirectUri(provider);

	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		code,
		grant_type: "authorization_code",
		redirect_uri: redirectUri,
	});

	const res = await fetch(config.tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token exchange failed (${res.status}): ${text}`);
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token ?? null,
		expiresIn: data.expires_in,
		scope: data.scope ?? "",
	};
}

export async function refreshAccessToken(
	provider: CalendarProvider,
	refreshToken: string,
): Promise<{ accessToken: string; expiresIn: number; refreshToken?: string | null }> {
	const config = getProviderConfig(provider);

	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		refresh_token: refreshToken,
		grant_type: "refresh_token",
	});

	const res = await fetch(config.tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token refresh failed (${res.status}): ${text}`);
	}

	const data = await res.json();
	return {
		accessToken: data.access_token,
		expiresIn: data.expires_in,
		refreshToken: data.refresh_token ?? undefined,
	};
}

export async function fetchProviderEmail(
	provider: CalendarProvider,
	accessToken: string,
): Promise<{ email: string; id: string }> {
	const config = getProviderConfig(provider);

	const res = await fetch(config.userinfoUrl, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Userinfo fetch failed (${res.status}): ${text}`);
	}

	const data = await res.json();

	if (provider === "google") {
		return { email: data.email, id: data.id };
	}

	return {
		email: data.mail ?? data.userPrincipalName ?? "",
		id: data.id,
	};
}

export async function revokeToken(provider: CalendarProvider, token: string): Promise<void> {
	const config = getProviderConfig(provider);

	try {
		if (provider === "google") {
			await fetch(`${config.revokeUrl}?token=${encodeURIComponent(token)}`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			});
		}
		// Microsoft doesn't support programmatic token revocation via a simple endpoint;
		// clearing the stored tokens is sufficient.
	} catch {
		// Best-effort revocation — don't fail the disconnect flow
	}
}
