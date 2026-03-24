"use client";

import { H3, SizableText, View, XStack, YStack } from "@repo/ui";

interface GradeWeight {
	label: string;
	weight: number;
}

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
						<View
							width={112}
							flexShrink={0}
							$sm={{ width: 160 }}
						>
							<SizableText
								size="$3"
								fontWeight="500"
								color="$color12"
								numberOfLines={2}
							>
								{w.label}
							</SizableText>
						</View>
						<View flex={1} minW={0}>
							<View
								width="100%"
								height={24}
								bg="$gray4"
								rounded="$2"
								overflow="hidden"
							>
								<View
									width={`${w.weight}%` as any}
									height="100%"
									bg="$color9"
									rounded="$2"
								/>
							</View>
						</View>
						<View width={44} flexShrink={0} items="flex-end">
							<SizableText
								size="$3"
								fontWeight="700"
								color="$gray10"
								text="right"
								fontVariant="tabular-nums"
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
