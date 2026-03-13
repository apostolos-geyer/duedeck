"use client";

import { Button, H3, SizableText, Spinner, View, XStack, YStack } from "@repo/ui";
import { Check, X } from "@tamagui/lucide-icons";
import { useCurrentUser } from "../../hooks/use-settings";

const FREE_FEATURES = [
	"3 courses",
	"Basic calendar sync",
	"Email reminders",
];

const PRO_FEATURES = [
	"Unlimited courses",
	"Priority parsing",
	"Study buddy matching",
	"All calendar integrations",
];

export function SubscriptionSection() {
	const { data: user, isLoading } = useCurrentUser();

	if (isLoading) {
		return (
			<YStack items="center" p="$4">
				<Spinner size="small" />
			</YStack>
		);
	}

	// Default to free plan
	const isFree = true;

	return (
		<YStack gap="$4">
			<H3 fontWeight="800" color="$color12">
				Subscription
			</H3>

			<XStack items="center" gap="$3">
				<SizableText>Current Plan:</SizableText>
				<View
					bg={isFree ? "$gray3" : "$purple3"}
					rounded="$2"
					px="$3"
					py="$1"
				>
					<SizableText fontWeight="700">
						{isFree ? "Free Plan" : "Pro Plan"}
					</SizableText>
				</View>
			</XStack>

			<YStack gap="$2">
				{FREE_FEATURES.map((feature) => (
					<XStack key={feature} gap="$2" items="center">
						<Check size={16} color="$green10" />
						<SizableText>{feature}</SizableText>
					</XStack>
				))}
				{PRO_FEATURES.map((feature) => (
					<XStack key={feature} gap="$2" items="center">
						{isFree ? (
							<X size={16} color="$gray9" />
						) : (
							<Check size={16} color="$green10" />
						)}
						<SizableText color={isFree ? "$gray9" : undefined}>
							{feature}
						</SizableText>
					</XStack>
				))}
			</YStack>

			{isFree && (
				<Button
					theme="purple"
					onPress={() => console.log("Upgrade clicked")}
				>
					Upgrade to Pro
				</Button>
			)}
		</YStack>
	);
}
