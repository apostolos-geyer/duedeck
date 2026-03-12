"use client";

import { H3, YStack } from "@repo/ui";
import { useAppForm } from "@repo/ui/form";
import { MOCK_USER } from "../../mock-data";

export function ProfileSection() {
	const form = useAppForm({
		defaultValues: {
			name: MOCK_USER.name,
			email: MOCK_USER.email,
			school: MOCK_USER.school,
			program: MOCK_USER.program,
			currentTerm: MOCK_USER.currentTerm,
		},
		onSubmit: async ({ value }) => {
			console.log("Profile saved:", value);
		},
	});

	return (
		<YStack gap="$4">
			<H3 fontWeight="800" color="$color12">
				Profile
			</H3>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<YStack gap="$3">
					<form.AppField name="name">
						{(field) => (
							<field.TextField
								label="Name"
								inputProps={{ placeholder: "Your name" }}
							/>
						)}
					</form.AppField>

					<form.AppField name="email">
						{(field) => (
							<field.TextField
								label="Email"
								inputProps={{
									placeholder: "email@example.com",
									autoCapitalize: "none",
									keyboardType: "email-address",
								}}
							/>
						)}
					</form.AppField>

					<form.AppField name="school">
						{(field) => (
							<field.TextField
								label="School"
								inputProps={{ placeholder: "Your school" }}
							/>
						)}
					</form.AppField>

					<form.AppField name="program">
						{(field) => (
							<field.TextField
								label="Program"
								inputProps={{ placeholder: "Your program" }}
							/>
						)}
					</form.AppField>

					<form.AppField name="currentTerm">
						{(field) => (
							<field.TextField
								label="Current Term"
								inputProps={{ placeholder: "e.g. Winter 2026" }}
							/>
						)}
					</form.AppField>

					<form.AppForm>
						<form.SubmitButton mt="$2">Save Changes</form.SubmitButton>
					</form.AppForm>
				</YStack>
			</form>
		</YStack>
	);
}
