import { useSession } from "@repo/auth/client";
import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";
import { YStack, Spinner } from "@repo/ui";

export default function AuthLayout() {
	const { data: session, isPending } = useSession();

	if (isPending) {
		return (
			<YStack flex={1} items="center" justify="center">
				<Spinner size="large" />
			</YStack>
		);
	}

	if (session) {
		return <Redirect href="/(app)/(dashboard)" />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
