import { useRouter } from "expo-router";
import { Pressable } from "react-native";

interface LinkProps {
	href: string;
	children: React.ReactNode;
	style?: Record<string, unknown>;
	asChild?: boolean;
}

export function Link({ href, children, style }: LinkProps) {
	const router = useRouter();
	return (
		<Pressable onPress={() => router.push(href as never)} style={style as any}>
			{children}
		</Pressable>
	);
}
