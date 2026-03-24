"use client";

import { Button, H4, SizableText, Spinner, YStack } from "@repo/ui";
import { Download } from "@tamagui/lucide-icons";
import { useCalendarConnections } from "../../hooks/use-calendar-data";
import { useDisconnectCalendar, useSyncGoogleCalendar } from "../../hooks/use-settings";
import { useQueryClient } from "@tanstack/react-query";

const OAUTH_PROVIDERS = new Set(["google", "microsoft"]);

const PROVIDER_LABELS: Record<string, string> = {
	google: "Google Calendar",
	microsoft: "Microsoft Outlook",
};

export function CalendarSyncPanel() {
	const { data: connections, isLoading } = useCalendarConnections();
	const disconnect = useDisconnectCalendar();
	const syncGoogle = useSyncGoogleCalendar();
	const queryClient = useQueryClient();

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
		<YStack gap="$3">
			<H4 fontWeight="800" color="$color12">
				Calendar Sync
			</H4>

			<YStack
				gap="$3"
				$sm={{ flexDirection: "row", gap: "$4" }}
				flexWrap="wrap"
			>
				{oauthConnections.map((conn) => (
					<YStack
						key={conn.provider}
						bg="$gray2"
						rounded="$4"
						p="$4"
						style={{ flex: "1 1 200px" }}
						gap="$2"
					>
						<SizableText fontWeight="700" color="$color12">
							{PROVIDER_LABELS[conn.provider] ?? conn.provider}
						</SizableText>

						<SizableText
							size="$2"
							color={conn.connected ? "$green10" : "$gray9"}
							fontWeight="500"
						>
							{conn.connected
								? `Connected (${conn.email})`
								: "Not connected"}
						</SizableText>

						{conn.connected ? (
							<YStack gap="$2" mt="$2">
								{conn.provider === "google" && (
									<Button
										size="$3"
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
									size="$3"
									onPress={() => {
										disconnect.mutate(
											{ provider: conn.provider },
											{
												onSuccess: () => queryClient.invalidateQueries(),
											},
										);
									}}
									disabled={disconnect.isPending}
								>
									Disconnect
								</Button>
							</YStack>
						) : (
							<Button
								size="$3"
								theme="purple"
								mt="$2"
								onPress={() => {
									window.location.href = `/api/calendar/${conn.provider}/authorize`;
								}}
							>
								Connect
							</Button>
						)}
					</YStack>
				))}

				{oauthConnections.length === 0 &&
					["google", "microsoft"].map((provider) => (
						<YStack
							key={provider}
							bg="$gray2"
							rounded="$4"
							p="$4"
							style={{ flex: "1 1 200px" }}
							gap="$2"
						>
							<SizableText fontWeight="700" color="$color12">
								{PROVIDER_LABELS[provider]}
							</SizableText>
							<SizableText size="$2" color="$gray9" fontWeight="500">
								Not connected
							</SizableText>
							<Button
								size="$3"
								theme="purple"
								mt="$2"
								onPress={() => {
									window.location.href = `/api/calendar/${provider}/authorize`;
								}}
							>
								Connect
							</Button>
						</YStack>
					))}

				{/* ICS Export */}
				<YStack
					bg="$gray2"
					rounded="$4"
					p="$4"
					style={{ flex: "1 1 200px" }}
					gap="$2"
					justify="center"
					items="center"
				>
					<Button
						size="$3"
						theme="purple"
						icon={<Download size={16} />}
					>
						Export ICS
					</Button>
				</YStack>
			</YStack>
		</YStack>
	);
}
