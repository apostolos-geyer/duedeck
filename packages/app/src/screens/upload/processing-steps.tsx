"use client";

import { useEffect, useState } from "react";
import { SizableText, Spinner, View, XStack, YStack } from "@repo/ui";
import { Check } from "@tamagui/lucide-icons";

const STEPS = [
	"Uploading PDF",
	"Computing content hash",
	"Checking for duplicates",
	"Parsing document",
	"Extracting deadlines",
];

interface ProcessingStepsProps {
	onComplete: () => void;
}

export function ProcessingSteps({ onComplete }: ProcessingStepsProps) {
	const [currentStep, setCurrentStep] = useState(0);

	useEffect(() => {
		if (currentStep >= STEPS.length) {
			onComplete();
			return;
		}

		const timer = setTimeout(() => {
			setCurrentStep((s) => s + 1);
		}, 1500);

		return () => clearTimeout(timer);
	}, [currentStep, onComplete]);

	return (
		<YStack gap="$2" py="$4" items="flex-start">
			{STEPS.map((label, index) => {
				const isCompleted = index < currentStep;
				const isActive = index === currentStep;

				return (
					<YStack key={label} items="flex-start">
						<XStack gap="$3" items="center">
							{/* Circle indicator */}
							<View
								width={32}
								height={32}
								rounded="$10"
								bg={
									isCompleted
										? "$green9"
										: isActive
											? "$purple9"
											: "$gray4"
								}
								items="center"
								justify="center"
							>
								{isCompleted ? (
									<Check size={18} color="white" />
								) : isActive ? (
									<Spinner size="small" color="white" />
								) : null}
							</View>

							{/* Label */}
							<SizableText
								size="$4"
								fontWeight={isActive ? "700" : "400"}
								color={
									isCompleted
										? "$green9"
										: isActive
											? "$color12"
											: "$gray8"
								}
							>
								{label}
							</SizableText>
						</XStack>

						{/* Connecting line */}
						{index < STEPS.length - 1 && (
							<View
								width={2}
								height={24}
								bg={isCompleted ? "$green9" : "$gray4"}
								ml={15}
							/>
						)}
					</YStack>
				);
			})}
		</YStack>
	);
}
