"use client";

import { useState } from "react";
import { AppCard, Button, H4, Paragraph, SizableText, Spinner, XStack, YStack } from "@repo/ui";
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
	const [open, setOpen] = useState(false);
	const { data: connections, isLoading } = useCalendarConnections();
	const disconnect = useDisconnectCalendar();
	const syncGoogle = useSyncGoogleCalendar();
	const queryClient = useQueryClient();

	const oauthConnections = (connections ?? []).filter((c) =>
		OAUTH_PROVIDERS.has(c.provider),
	);

	return (
		<YStack gap="$3">
			<Button
				size="$3"
				theme="purple"
				onPress={() => setOpen((v) => !v)}
			>
				{open ? "Hide Calendar Sync" : "Show Calendar Sync"}
			</Button>

			{open && (
				<YStack gap="$3">
					{isLoading ? (
						<YStack items="center" p="$4">
							<Spinner size="small" />
						</YStack>
					) : (
						<XStack gap="$4" flexWrap="wrap">
							{oauthConnections.map((conn) => (
								<AppCard
									key={conn.provider}
									rounded={0}
									style={{ flex: "1 1 200px" }}
								>
									<YStack gap="$2" p="$4">
										<H4 fontFamily="$heading">
											{PROVIDER_LABELS[conn.provider] ?? conn.provider}
										</H4>

										<Paragraph
											size="$2"
											color={conn.connected ? "$green10" : "$gray9"}
											fontWeight="500"
										>
											{conn.connected
												? `Connected (${conn.email})`
												: "Not connected"}
										</Paragraph>

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
								</AppCard>
							))}

							{oauthConnections.length === 0 &&
								["google", "microsoft"].map((provider) => (
									<AppCard
										key={provider}
										rounded={0}
										style={{ flex: "1 1 200px" }}
									>
										<YStack gap="$2" p="$4">
											<H4 fontFamily="$heading">
												{PROVIDER_LABELS[provider]}
											</H4>
											<Paragraph size="$2" color="$gray9" fontWeight="500">
												Not connected
											</Paragraph>
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
									</AppCard>
								))}

							{/* ICS Export */}
							<AppCard
								rounded={0}
								style={{ flex: "1 1 200px" }}
							>
								<YStack
									gap="$2"
									p="$4"
									justify="center"
									items="center"
									flex={1}
								>
									<H4 fontFamily="$heading">Export</H4>
									<Button
										size="$3"
										theme="purple"
										icon={<Download size={16} />}
									>
										Export ICS
									</Button>
								</YStack>
							</AppCard>
						</XStack>
					)}
				</YStack>
			)}
		</YStack>
	);
}
