"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, SizableText, Spinner, XStack } from "@repo/ui";
import { CheckCircle, AlertCircle, X } from "@tamagui/lucide-icons";
import { useActiveRun } from "../contexts/active-run-context";
import type { ProgressEvent } from "../workflows/parse-document";

interface ProcessingBannerProps {
	orpc: {
		documents: {
			stream: {
				experimental_streamedOptions: (opts: {
					input: { runId: string };
					retry: boolean;
				}) => unknown;
			};
		};
	};
	onNavigate: (path: string) => void;
}

export function ProcessingBanner({ orpc, onNavigate }: ProcessingBannerProps) {
	const { run } = useActiveRun();
	if (!run) return null;
	return (
		<ProcessingBannerInner
			run={run}
			orpc={orpc}
			onNavigate={onNavigate}
		/>
	);
}

function ProcessingBannerInner({
	run,
	orpc,
	onNavigate,
}: ProcessingBannerProps & { run: NonNullable<ReturnType<typeof useActiveRun>["run"]> }) {
	const { updateRun, clearRun } = useActiveRun();

	const { data } = useQuery(
		orpc.documents.stream.experimental_streamedOptions({
			input: { runId: run.runId },
			retry: false,
		}) as { queryKey: unknown[]; queryFn: () => Promise<unknown> },
	);

	const events = (data ?? []) as ProgressEvent[];

	const latestStep = useMemo(() => {
		for (let i = events.length - 1; i >= 0; i--) {
			if (events[i]?.step) return events[i].step;
		}
		return undefined;
	}, [events]);

	const doneEvent = useMemo(
		() => events.find((e) => e.step === "done" && e.status === "done"),
		[events],
	);

	const errorMsg = useMemo(() => {
		for (let i = events.length - 1; i >= 0; i--) {
			if (events[i]?.data?.error) return events[i].data.error as string;
		}
		return undefined;
	}, [events]);

	const docId = useMemo(() => {
		for (const e of events) {
			if (e.data?.docId) return e.data.docId as string;
		}
		return undefined;
	}, [events]);

	const prevStepRef = useRef(latestStep);
	const prevDoneRef = useRef(!!doneEvent);
	const prevErrorRef = useRef(errorMsg);

	useEffect(() => {
		if (latestStep && latestStep !== prevStepRef.current) {
			prevStepRef.current = latestStep;
			updateRun({ step: latestStep });
		}
	}, [latestStep, updateRun]);

	useEffect(() => {
		if (doneEvent && !prevDoneRef.current) {
			prevDoneRef.current = true;
			updateRun({ status: "done", docId: docId ?? undefined });
		}
	}, [doneEvent, docId, updateRun]);

	useEffect(() => {
		if (errorMsg && errorMsg !== prevErrorRef.current) {
			prevErrorRef.current = errorMsg;
			updateRun({ status: "error", error: errorMsg });
		}
	}, [errorMsg, updateRun]);

	if (run.status === "done") {
		return (
			<XStack
				bg="$green3"
				px="$4"
				py="$2"
				items="center"
				gap="$3"
			>
				<CheckCircle size={16} color="$green11" />
				<SizableText size="$2" color="$green11" flex={1}>
					Document processed successfully
				</SizableText>
				{run.docId && (
					<Button
						size="$2"
						theme="green"
						onPress={() => {
							clearRun();
							onNavigate(`/doc/${run.docId}`);
						}}
					>
						View
					</Button>
				)}
				<Button unstyled p="$1" onPress={clearRun}>
					<X size={14} color="$green11" />
				</Button>
			</XStack>
		);
	}

	if (run.status === "error") {
		return (
			<XStack
				bg="$red3"
				px="$4"
				py="$2"
				items="center"
				gap="$3"
			>
				<AlertCircle size={16} color="$red11" />
				<SizableText size="$2" color="$red11" flex={1} numberOfLines={1}>
					{run.error ?? "Processing failed"}
				</SizableText>
				<Button
					size="$2"
					theme="red"
					onPress={() => {
						clearRun();
						onNavigate("/upload");
					}}
				>
					Retry
				</Button>
				<Button unstyled p="$1" onPress={clearRun}>
					<X size={14} color="$red11" />
				</Button>
			</XStack>
		);
	}

	return (
		<XStack
			bg="$purple3"
			px="$4"
			py="$2"
			items="center"
			gap="$3"
		>
			<Spinner size="small" color="$purple11" />
			<SizableText size="$2" color="$purple11" flex={1}>
				Processing document{run.step ? ` — ${run.step}` : "..."}
			</SizableText>
			<Button
				size="$2"
				theme="purple"
				onPress={() => onNavigate(`/upload/${run.runId}`)}
			>
				View
			</Button>
		</XStack>
	);
}
