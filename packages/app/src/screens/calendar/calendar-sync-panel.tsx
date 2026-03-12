"use client";

import { Button, H4, SizableText, YStack } from "@repo/ui";
import { Download } from "@tamagui/lucide-icons";
import { MOCK_CALENDAR_CONNECTIONS } from "../../mock-data";

const PROVIDER_LABELS: Record<string, string> = {
	google: "Google Calendar",
	microsoft: "Microsoft Outlook",
	apple: "Apple Calendar",
};

export function CalendarSyncPanel() {
	return (
		<YStack gap="$3">
			<H4 fontWeight="800" color="$color12">
				Calendar Sync
			</H4>

			<YStack gap="$3" $sm={{ flexDirection: "row", gap: "$4" }} flexWrap="wrap">
				{MOCK_CALENDAR_CONNECTIONS.map((conn) => (
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

						<Button
							size="$3"
							theme={conn.connected ? undefined : "purple"}
							mt="$2"
						>
							{conn.connected ? "Disconnect" : "Connect"}
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
