export type CalendarProvider = "google" | "microsoft";

export interface ProviderConfig {
	authUrl: string;
	tokenUrl: string;
	revokeUrl: string;
	userinfoUrl: string;
	scopes: string[];
	clientId: string;
	clientSecret: string;
}

const SUPPORTED_PROVIDERS = new Set<string>(["google", "microsoft"]);

export function isValidProvider(provider: string): provider is CalendarProvider {
	return SUPPORTED_PROVIDERS.has(provider);
}

export function getProviderConfig(provider: CalendarProvider): ProviderConfig {
	switch (provider) {
		case "google":
			return {
				authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
				tokenUrl: "https://oauth2.googleapis.com/token",
				revokeUrl: "https://oauth2.googleapis.com/revoke",
				userinfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
				scopes: [
					"https://www.googleapis.com/auth/calendar.events",
					"https://www.googleapis.com/auth/calendar.readonly",
					"https://www.googleapis.com/auth/userinfo.email",
				],
				clientId: requireEnv("GOOGLE_CLIENT_ID"),
				clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
			};
		case "microsoft":
			return {
				authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
				tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
				revokeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
				userinfoUrl: "https://graph.microsoft.com/v1.0/me",
				scopes: ["Calendars.ReadWrite", "User.Read", "offline_access"],
				clientId: requireEnv("MICROSOFT_CLIENT_ID"),
				clientSecret: requireEnv("MICROSOFT_CLIENT_SECRET"),
			};
	}
}

export function getRedirectUri(provider: CalendarProvider): string {
	const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
	return `${baseUrl}/api/calendar/${provider}/callback`;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}
