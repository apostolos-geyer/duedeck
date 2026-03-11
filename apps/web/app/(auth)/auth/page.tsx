"use client";

import { signIn, signUp } from "@repo/auth/client";
import { Button, H2, Input, Label, Paragraph, XStack, YStack } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthPage() {
	const router = useRouter();
	const [tab, setTab] = useState<"signin" | "signup">("signin");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	function resetFields() {
		setName("");
		setEmail("");
		setPassword("");
		setConfirmPassword("");
		setError("");
	}

	function switchTab(newTab: "signin" | "signup") {
		setTab(newTab);
		resetFields();
	}

	async function handleSignIn() {
		setError("");
		setLoading(true);
		try {
			const { error } = await signIn.email({ email, password });
			if (error) {
				setError(error.message ?? "Sign in failed");
			} else {
				router.push("/");
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Sign in failed");
		} finally {
			setLoading(false);
		}
	}

	async function handleSignUp() {
		setError("");
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		setLoading(true);
		try {
			const { error } = await signUp.email({ email, password, name });
			if (error) {
				setError(error.message ?? "Sign up failed");
			} else {
				router.push("/");
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Sign up failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<YStack gap="$4" width={360}>
			<YStack items="center">
				<H2>{tab === "signin" ? "Sign In" : "Sign Up"}</H2>
			</YStack>

			<XStack gap="$2">
				<Button
					flex={1}
					onPress={() => switchTab("signin")}
					variant={tab === "signin" ? undefined : "outlined"}
				>
					Sign In
				</Button>
				<Button
					flex={1}
					onPress={() => switchTab("signup")}
					variant={tab === "signup" ? undefined : "outlined"}
				>
					Sign Up
				</Button>
			</XStack>

			{error ? (
				<Paragraph color="$red10">{error}</Paragraph>
			) : null}

			<YStack gap="$3">
				{tab === "signup" && (
					<YStack gap="$1">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="Your name"
							value={name}
							onChangeText={setName}
							autoCapitalize="words"
						/>
					</YStack>
				)}

				<YStack gap="$1">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						placeholder="email@example.com"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>
				</YStack>

				<YStack gap="$1">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						placeholder="Password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>
				</YStack>

				{tab === "signup" && (
					<YStack gap="$1">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							placeholder="Confirm password"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
						/>
					</YStack>
				)}

				<Button
					onPress={tab === "signin" ? handleSignIn : handleSignUp}
					disabled={loading}
					mt="$2"
				>
					{loading
						? "Loading..."
						: tab === "signin"
							? "Sign In"
							: "Sign Up"}
				</Button>
			</YStack>
		</YStack>
	);
}
