import { useRouter } from "expo-router";

export function useAppRouter() {
	const router = useRouter();
	return {
		// biome-ignore lint: expo-router href typing requires cast
		push: (href: string) => router.push(href as any),
		// biome-ignore lint: expo-router href typing requires cast
		replace: (href: string) => router.replace(href as any),
		back: () => router.back(),
	};
}
