"use client";

import { AppCard, Spinner, YStack } from "@repo/ui";
import { useAppForm } from "@repo/ui/form";
import { useCurrentUser, useUpdateProfile } from "../../hooks/use-settings";

export function ProfileSection() {
	const { data: user, isLoading } = useCurrentUser();
	const updateProfile = useUpdateProfile();

	if (isLoading || !user) {
		return (
			<YStack items="center" p="$4">
				<Spinner size="small" />
			</YStack>
		);
	}

	return <ProfileForm user={user} onSubmit={(value) => updateProfile.mutate(value)} />;
}

function ProfileForm({
	user,
	onSubmit,
}: {
	user: { name: string; email: string; school: string | null; program: string | null; currentTerm: string | null };
	onSubmit: (value: { name?: string; school?: string; program?: string; currentTerm?: string }) => void;
}) {
	const form = useAppForm({
		defaultValues: {
			name: user.name,
			email: user.email,
			school: user.school ?? "",
			program: user.program ?? "",
			currentTerm: user.currentTerm ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit(value);
		},
	});

	return (
		<AppCard size="lg">
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
						<form.SubmitButton theme="purple" mt="$2">Save Changes</form.SubmitButton>
					</form.AppForm>
				</YStack>
			</form>
		</AppCard>
	);
}
