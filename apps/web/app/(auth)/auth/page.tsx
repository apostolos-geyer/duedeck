"use client";

import { signIn, signUp } from "@repo/auth/client";
import {
	Button,
	Card,
	H2,
	Input,
	Label,
	SizableText,
	Tabs,
	XStack,
	YStack,
} from "@repo/ui";
import { useAppForm } from "@repo/ui/form";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignInForm() {
	const router = useRouter();

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			const { error } = await signIn.email({
				email: value.email,
				password: value.password,
			});
			if (error) {
				form.setErrorMap({
					onSubmit: {
						form: error.message ?? "Sign in failed",
						fields: {},
					},
				});
				return;
			}
			router.push("/");
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<YStack gap="$3">
				<form.AppField
					name="email"
					validators={{
						onBlur: ({ value }) => {
							if (!value) return "Email is required";
							if (!EMAIL_REGEX.test(value)) return "Invalid email address";
							return undefined;
						},
					}}
				>
					{(field) => (
						<field.TextField
							label="Email"
							required
							inputProps={{
								placeholder: "email@example.com",
								autoCapitalize: "none",
								keyboardType: "email-address",
							}}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="password"
					validators={{
						onBlur: ({ value }) => {
							if (!value) return "Password is required";
							if (value.length < 6) return "Password must be at least 6 characters";
							return undefined;
						},
					}}
				>
					{(field) => (
						<field.TextField
							label="Password"
							required
							inputProps={{
								placeholder: "Password",
								secureTextEntry: true,
							}}
						/>
					)}
				</form.AppField>

				<form.AppForm>
					<form.FormErrors />
					<form.SubmitButton mt="$2">Sign In</form.SubmitButton>
				</form.AppForm>
			</YStack>
		</form>
	);
}

function SignUpForm() {
	const router = useRouter();

	const form = useAppForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			const { error } = await signUp.email({
				email: value.email,
				password: value.password,
				name: value.name,
			});
			if (error) {
				form.setErrorMap({
					onSubmit: {
						form: error.message ?? "Sign up failed",
						fields: {},
					},
				});
				return;
			}
			router.push("/");
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<YStack gap="$3">
				<form.AppField
					name="name"
					validators={{
						onBlur: ({ value }) => {
							if (!value.trim()) return "Name is required";
							return undefined;
						},
					}}
				>
					{(field) => (
						<field.TextField
							label="Name"
							required
							inputProps={{
								placeholder: "Your name",
								autoCapitalize: "words",
							}}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="email"
					validators={{
						onBlur: ({ value }) => {
							if (!value) return "Email is required";
							if (!EMAIL_REGEX.test(value)) return "Invalid email address";
							return undefined;
						},
					}}
				>
					{(field) => (
						<field.TextField
							label="Email"
							required
							inputProps={{
								placeholder: "email@example.com",
								autoCapitalize: "none",
								keyboardType: "email-address",
							}}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="password"
					validators={{
						onBlur: ({ value }) => {
							if (!value) return "Password is required";
							if (value.length < 8)
								return "Password must be at least 8 characters";
							return undefined;
						},
					}}
				>
					{(field) => (
						<field.TextField
							label="Password"
							required
							inputProps={{
								placeholder: "Password",
								secureTextEntry: true,
							}}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="confirmPassword"
					validators={{
						onChangeListenTo: ["password"],
						onBlur: ({ value, fieldApi }) => {
							if (!value) return "Please confirm your password";
							const password = fieldApi.form.getFieldValue("password");
							if (value !== password) return "Passwords do not match";
							return undefined;
						},
						onChange: ({ value, fieldApi }) => {
							if (!value) return undefined;
							const password = fieldApi.form.getFieldValue("password");
							if (value !== password) return "Passwords do not match";
							return undefined;
						},
					}}
				>
					{(field) => (
						<field.TextField
							label="Confirm Password"
							required
							inputProps={{
								placeholder: "Confirm password",
								secureTextEntry: true,
							}}
						/>
					)}
				</form.AppField>

				<form.AppForm>
					<form.FormErrors />
					<form.SubmitButton mt="$2">Sign Up</form.SubmitButton>
				</form.AppForm>
			</YStack>
		</form>
	);
}

export default function AuthPage() {
	const [tab, setTab] = useState<"signin" | "signup">("signin");

	return (
		<Card
			width="100%"
			maxW={480}
			borderWidth={2}
			borderColor="$gray6"
			rounded={0}
			p="$5"
		>
			<Tabs
				value={tab}
				onValueChange={(val) => setTab(val as "signin" | "signup")}
				orientation="horizontal"
				flexDirection="column"
			>
				<Tabs.List>
					<Tabs.Tab
						flex={1}
						value="signin"
						rounded={0}
						{...(tab === "signin"
							? {
									bg: "$purple3",
									borderBottomWidth: 2,
									borderBottomColor: "$purple9",
								}
							: { bg: "transparent" })}
					>
						<SizableText>Sign In</SizableText>
					</Tabs.Tab>
					<Tabs.Tab
						flex={1}
						value="signup"
						rounded={0}
						{...(tab === "signup"
							? {
									bg: "$purple3",
									borderBottomWidth: 2,
									borderBottomColor: "$purple9",
								}
							: { bg: "transparent" })}
					>
						<SizableText>Sign Up</SizableText>
					</Tabs.Tab>
				</Tabs.List>

				<YStack mt="$4">
					{tab === "signin" ? <SignInForm /> : <SignUpForm />}
				</YStack>
			</Tabs>
		</Card>
	);
}
