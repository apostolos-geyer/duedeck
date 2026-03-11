"use client";

import { Paragraph, YStack } from "tamagui";
import { useFormContext } from "../form-context";

export function FormErrors() {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => state.errors}>
			{(errors) =>
				errors.length > 0 ? (
					<YStack gap="$1" p="$2" bg="$red2" rounded="$2">
						{errors.map((error) => (
							<Paragraph key={String(error)} color="$red10" fontSize="$2">
								{String(error)}
							</Paragraph>
						))}
					</YStack>
				) : null
			}
		</form.Subscribe>
	);
}
