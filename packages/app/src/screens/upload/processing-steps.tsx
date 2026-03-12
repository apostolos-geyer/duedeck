"use client";

import { useEffect, useMemo } from "react";
import { SizableText, Spinner, View, XStack, YStack } from "@repo/ui";
import { Check } from "@tamagui/lucide-icons";

export type ProgressStep =
	| "uploading"
	| "hashing"
	| "dedup"
	| "parsing"
	| "extracting"
	| "done";

const STEP_ORDER: ProgressStep[] = [
	"hashing",
	"dedup",
	"parsing",
	"extracting",
];

const STEP_LABELS: Record<ProgressStep, string> = {
	uploading: "Uploading PDF",
	hashing: "Computing content hash",
	dedup: "Checking for duplicates",
	parsing: "Parsing document",
	extracting: "Extracting deadlines",
	done: "Done",
};

export interface ProgressEvent {
	step: ProgressStep;
	status: "start" | "done";
	data?: Record<string, unknown>;
}

interface ProcessingStepsProps {
	events: ProgressEvent[];
	onComplete: (data?: Record<string, unknown>) => void;
}

export function ProcessingSteps({ events, onComplete }: ProcessingStepsProps) {
	const completedSteps = useMemo(() => {
		const set = new Set<ProgressStep>();
		for (const event of events) {
			if (event.status === "done" && event.step !== "done") {
				set.add(event.step);
			}
		}
		return set;
	}, [events]);

	const activeStep = useMemo((): ProgressStep => {
		for (let i = events.length - 1; i >= 0; i--) {
			const evt = events[i];
			if (evt && evt.status === "start") {
				return evt.step;
			}
		}
		return "hashing";
	}, [events]);

	const doneEvent = useMemo(() => {
		return events.find((e) => e.step === "done" && e.status === "done");
	}, [events]);

	useEffect(() => {
		if (doneEvent) {
			onComplete(doneEvent.data);
		}
	}, [doneEvent, onComplete]);

	return (
		<YStack gap="$2" py="$4" items="flex-start">
			{STEP_ORDER.map((step, index) => {
				const isCompleted = completedSteps.has(step);
				const isActive = step === activeStep && !isCompleted;

				return (
					<YStack key={step} items="flex-start">
						<XStack gap="$3" items="center">
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
								{STEP_LABELS[step]}
							</SizableText>
						</XStack>

						{index < STEP_ORDER.length - 1 && (
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
