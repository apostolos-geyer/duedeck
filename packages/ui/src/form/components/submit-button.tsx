"use client";

import type { GetProps } from "tamagui";
import { Button, Spinner } from "tamagui";
import { useFormContext } from "../form-context";

export interface SubmitButtonProps
	extends Omit<GetProps<typeof Button>, "disabled"> {
	submittingText?: string;
}

export function SubmitButton({
	children = "Submit",
	submittingText = "Submitting...",
	...buttonProps
}: SubmitButtonProps) {
	const form = useFormContext();

	return (
		<form.Subscribe
			selector={(state) => ({
				canSubmit: state.canSubmit,
				isSubmitting: state.isSubmitting,
			})}
		>
			{({ canSubmit, isSubmitting }) => (
				<Button
					type="submit"
					disabled={!canSubmit}
					onPress={() => form.handleSubmit()}
					{...buttonProps}
				>
					{isSubmitting ? (
						<>
							<Spinner size="small" />
							{submittingText}
						</>
					) : (
						children
					)}
				</Button>
			)}
		</form.Subscribe>
	);
}
