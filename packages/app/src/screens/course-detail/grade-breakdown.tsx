"use client";

import { H3, SizableText, View, XStack, YStack } from "@repo/ui";
import type { GradeWeight } from "../../mock-data";

interface GradeBreakdownProps {
	weights: GradeWeight[];
}

export function GradeBreakdown({ weights }: GradeBreakdownProps) {
	return (
		<YStack gap="$3">
			<H3 fontWeight="800" color="$color12">
				Grade Breakdown
			</H3>
			<YStack gap="$2">
				{weights.map((w) => (
					<XStack key={w.label} gap="$3" items="center">
						<View minW={80} $sm={{ minW: 140 }}>
							<SizableText size="$3" fontWeight="500" color="$color12">
								{w.label}
							</SizableText>
						</View>
						<View flex={1}>
							<View
								width={`${w.weight}%` as any}
								height={24}
								bg="$color9"
								rounded="$2"
							/>
						</View>
						<View minW={40}>
							<SizableText
								size="$3"
								fontWeight="700"
								color="$gray10"
								text="right"
							>
								{w.weight}%
							</SizableText>
						</View>
					</XStack>
				))}
			</YStack>
		</YStack>
	);
}
