"use client";

import { useState } from "react";
import { Button, H3, SizableText, YStack } from "@repo/ui";
import {
	MOCK_CALENDAR_CONNECTIONS,
	type CalendarConnection,
} from "../../mock-data";

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function CalendarsSection() {
	const [connections, setConnections] = useState<CalendarConnection[]>(
		MOCK_CALENDAR_CONNECTIONS,
	);

	function toggleConnection(provider: CalendarConnection["provider"]) {
		setConnections((prev) =>
			prev.map((c) =>
				c.provider === provider ? { ...c, connected: !c.connected } : c,
			),
		);
	}

	return (
		<YStack gap="$4">
			<H3 fontWeight="800" color="$color12">
				Connected Calendars
			</H3>

			<YStack gap="$3" $sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}>
				{connections.map((connection) => (
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
							{capitalize(connection.provider)}
						</SizableText>
						<SizableText size="$2" color="$gray10">
							{connection.connected
								? connection.email ?? "Connected"
								: "Not connected"}
						</SizableText>
						<Button
							theme={connection.connected ? undefined : "purple"}
							variant={connection.connected ? "outlined" : undefined}
							onPress={() => toggleConnection(connection.provider)}
						>
							{connection.connected ? "Disconnect" : "Connect"}
						</Button>
					</YStack>
				))}
			</YStack>
		</YStack>
	);
}
