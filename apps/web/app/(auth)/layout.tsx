"use client";

import { XStack, YStack, H1, Paragraph, View } from "@repo/ui";

export default function AuthLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<XStack flex={1} height="100vh">
			{/* Brand panel — hidden on mobile, visible at $md+ */}
			<YStack
				display="none"
				$md={{ display: "flex" }}
				flex={1}
				bg="$purple2"
				items="center"
				justify="center"
				p="$6"
			>
				<View
					flex={1}
					width="100%"
					borderWidth={4}
					borderColor="$purple7"
					items="center"
					justify="center"
					m="$5"
				>
					<YStack items="center" gap="$3">
						<H1 fontFamily="$heading" color="$purple12">
							DueDeck
						</H1>
						<Paragraph color="$purple11">
							Never miss a deadline.
						</Paragraph>
					</YStack>
				</View>
			</YStack>

			{/* Form area */}
			<YStack
				flex={1}
				items="center"
				justify="center"
				p="$4"
			>
				{children}
			</YStack>
		</XStack>
	);
}
