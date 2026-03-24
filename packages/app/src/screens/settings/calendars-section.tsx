"use client";

import { Button, H3, SizableText, Spinner, XStack, YStack } from "@repo/ui";
import { useCalendarConnections } from "../../hooks/use-calendar-data";
import { useDisconnectCalendar, useSyncGoogleCalendar } from "../../hooks/use-settings";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const OAUTH_PROVIDERS = new Set(["google", "microsoft"]);

const PROVIDER_LABELS: Record<string, string> = {
	google: "Google Calendar",
	microsoft: "Microsoft Outlook",
};

export function CalendarsSection() {
	const { data: connections, isLoading } = useCalendarConnections();
	const queryClient = useQueryClient();
	const disconnect = useDisconnectCalendar();
	const syncGoogle = useSyncGoogleCalendar();

	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const calendarStatus = params.get("calendar");
		if (calendarStatus !== "connected") return;

		const finish = () => {
			queryClient.invalidateQueries();
			window.history.replaceState({}, "", window.location.pathname);
		};

		if (params.get("sync") === "1") {
			const lockKey = "duedeck_gcal_oauth_autosync";
			const now = Date.now();
			const prev = sessionStorage.getItem(lockKey);
			if (prev && now - Number(prev) < 15_000) {
				finish();
				return;
			}
			sessionStorage.setItem(lockKey, String(now));
			syncGoogle.mutate(undefined, { onSettled: finish });
			return;
		}
		finish();
	}, [queryClient, syncGoogle]);

	if (isLoading) {
		return (
			<YStack items="center" p="$4">
				<Spinner size="small" />
			</YStack>
		);
	}

	const oauthConnections = (connections ?? []).filter((c) =>
		OAUTH_PROVIDERS.has(c.provider),
	);

	return (
		<YStack gap="$4">
			<H3 fontWeight="800" color="$color12">
				Connected Calendars
			</H3>

			<YStack
				gap="$3"
				$sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}
			>
				{oauthConnections.map((connection) => (
					<YStack
						key={connection.provider}
						bg="$gray2"
						rounded="$4"
						p="$4"
						gap="$2"
						flex={1}
						minW={200}
					>
						<SizableText fontWeight="700">
							{PROVIDER_LABELS[connection.provider] ?? connection.provider}
						</SizableText>
						<SizableText size="$2" color="$gray10">
							{connection.connected
								? connection.email ?? "Connected"
								: "Not connected"}
						</SizableText>
						{connection.connected ? (
							<XStack gap="$2" flexWrap="wrap">
								{connection.provider === "google" && (
									<Button
										theme="purple"
										onPress={() => {
											syncGoogle.mutate(undefined, {
												onSuccess: () => queryClient.invalidateQueries(),
											});
										}}
										disabled={syncGoogle.isPending}
									>
										Sync now
									</Button>
								)}
								<Button
									variant="outlined"
									onPress={() => {
										disconnect.mutate(
											{ provider: connection.provider },
											{
												onSuccess: () => queryClient.invalidateQueries(),
											},
										);
									}}
									disabled={disconnect.isPending}
								>
									Disconnect
								</Button>
							</XStack>
						) : (
							<Button
								theme="purple"
								onPress={() => {
									window.location.href = `/api/calendar/${connection.provider}/authorize`;
								}}
							>
								Connect
							</Button>
						)}
					</YStack>
				))}

				{oauthConnections.length === 0 && (
					<XStack gap="$3" flexWrap="wrap">
						{["google", "microsoft"].map((provider) => (
							<YStack
								key={provider}
								bg="$gray2"
								rounded="$4"
								p="$4"
								gap="$2"
								flex={1}
								minW={200}
							>
								<SizableText fontWeight="700">
									{PROVIDER_LABELS[provider]}
								</SizableText>
								<SizableText size="$2" color="$gray10">
									Not connected
								</SizableText>
								<Button
									theme="purple"
									onPress={() => {
										window.location.href = `/api/calendar/${provider}/authorize`;
									}}
								>
									Connect
								</Button>
							</YStack>
						))}
					</XStack>
				)}
			</YStack>
		</YStack>
	);
}
