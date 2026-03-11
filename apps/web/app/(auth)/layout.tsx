"use client";

import { YStack } from "@repo/ui";

export default function AuthLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<YStack flex={1} items="center" justify="center" height="100vh" p="$4">
			{children}
		</YStack>
	);
}
