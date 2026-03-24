"use client";

import { AppCard, H3, Progress, SizableText, Theme, View, XStack, YStack } from "@repo/ui";

interface GradeWeight {
	label: string;
	weight: number;
}

interface GradeBreakdownProps {
	weights: GradeWeight[];
}

const THEME_COLORS = [
	"blue",
	"purple",
	"green",
	"orange",
	"red",
	"yellow",
	"pink",
	"cyan",
] as const;

export function GradeBreakdown({ weights }: GradeBreakdownProps) {
	return (
		<AppCard size="md">
			<YStack gap="$4">
				<H3 fontFamily="$heading" fontWeight="800" color="$color12">
					Grade Breakdown
				</H3>
				<YStack gap="$3">
					{weights.map((w, i) => {
						const themeName = THEME_COLORS[i % THEME_COLORS.length];
						return (
							<Theme key={w.label} name={themeName as any}>
								<YStack gap="$1">
									<XStack items="center" justify="space-between">
										<SizableText
											size="$3"
											fontWeight="500"
											color="$color12"
											numberOfLines={2}
										>
											{w.label}
										</SizableText>
										<SizableText
											size="$3"
											fontWeight="700"
											color="$color11"
											fontVariant={["tabular-nums"]}
										>
											{w.weight}%
										</SizableText>
									</XStack>
									<Progress
										value={w.weight}
										height={8}
										bg="$gray4"
										rounded={0}
									>
										<Progress.Indicator
											bg="$color9"
											rounded={0}
										/>
									</Progress>
								</YStack>
							</Theme>
						);
					})}
				</YStack>
			</YStack>
		</AppCard>
	);
}
