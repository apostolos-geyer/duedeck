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
	| "reviewing"
	| "done";

const STEP_ORDER: ProgressStep[] = [
	"hashing",
	"dedup",
	"parsing",
	"extracting",
	"reviewing",
];

const STEP_LABELS: Record<ProgressStep, string> = {
	uploading: "Uploading PDF",
	hashing: "Computing content hash",
	dedup: "Checking for duplicates",
	parsing: "Parsing document",
	extracting: "Extracting syllabus data",
	reviewing: "Review extracted data",
	done: "Done",
};

export interface ProgressEvent {
	step: ProgressStep;
	status: "start" | "done";
	data?: Record<string, unknown>;
}

function useProgressState(events: ProgressEvent[]) {
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

	// Extract chunk progress detail from extracting events
	const extractionDetail = useMemo((): string | null => {
		for (let i = events.length - 1; i >= 0; i--) {
			const evt = events[i];
			if (evt?.step !== "extracting" || evt.status !== "start") continue;
			if (evt.data?.mode !== "chunked") continue;

			const total = evt.data.totalChunks as number;
			const relevant = evt.data.relevantChunks as number | undefined;

			if (evt.data.phase === "screening_done" && relevant != null) {
				return `Extracting from ${relevant} of ${total} pages`;
			}
			return `Screening ${total} pages`;
		}
		return null;
	}, [events]);

	return { completedSteps, activeStep, doneEvent, extractionDetail };
}

// ── Compact horizontal stepper (always visible) ─────────────────────

interface ProgressBarProps {
	events: ProgressEvent[];
}

export function ProgressBar({ events }: ProgressBarProps) {
	const { completedSteps, activeStep } = useProgressState(events);

	const PHASES: { key: ProgressStep; label: string }[] = [
		{ key: "parsing", label: "Parse" },
		{ key: "extracting", label: "Extract" },
		{ key: "reviewing", label: "Review" },
	];

	const activePhaseIdx = PHASES.findIndex((p) => p.key === activeStep);
	const isPreProcessing =
		activeStep === "hashing" ||
		activeStep === "dedup" ||
		activeStep === "uploading";

	return (
		<XStack gap="$2" items="center" py="$2">
			{PHASES.map((phase, idx) => {
				const isDone = completedSteps.has(phase.key);
				const isActive =
					(idx === 0 && isPreProcessing) ||
					phase.key === activeStep;
				const isPast =
					isDone || (activePhaseIdx > idx && !isPreProcessing);

				return (
					<XStack key={phase.key} gap="$2" items="center" flex={1}>
						{idx > 0 && (
							<View
								flex={1}
								height={2}
								bg={isPast ? "$green9" : "$gray4"}
								rounded="$10"
							/>
						)}
						<XStack gap="$1.5" items="center">
							<View
								width={24}
								height={24}
								rounded="$10"
								bg={
									isDone
										? "$green9"
										: isActive
											? "$purple9"
											: "$gray4"
								}
								items="center"
								justify="center"
							>
								{isDone ? (
									<Check size={14} color="white" />
								) : isActive ? (
									<Spinner size="small" color="white" />
								) : (
									<SizableText
										size="$1"
										color={isPast ? "white" : "$gray8"}
										fontWeight="700"
									>
										{idx + 1}
									</SizableText>
								)}
							</View>
							<SizableText
								size="$1"
								fontWeight={isActive ? "700" : "400"}
								color={
									isDone
										? "$green9"
										: isActive
											? "$color12"
											: "$gray8"
								}
								display="none"
								$md={{ display: "flex" }}
							>
								{phase.label}
							</SizableText>
						</XStack>
					</XStack>
				);
			})}
		</XStack>
	);
}

// ── Detailed vertical steps (shown during processing only) ──────────

interface ProcessingStepsProps {
	events: ProgressEvent[];
	onComplete: (data?: Record<string, unknown>) => void;
}

export function ProcessingSteps({ events, onComplete }: ProcessingStepsProps) {
	const { completedSteps, activeStep, doneEvent, extractionDetail } =
		useProgressState(events);

	useEffect(() => {
		if (doneEvent) {
			onComplete(doneEvent.data);
		}
	}, [doneEvent, onComplete]);

	return (
		<YStack gap="$2" py="$2" items="flex-start">
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

							<YStack>
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
								{step === "extracting" &&
									isActive &&
									extractionDetail && (
										<SizableText
											size="$2"
											color="$gray9"
										>
											{extractionDetail}
										</SizableText>
									)}
							</YStack>
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
