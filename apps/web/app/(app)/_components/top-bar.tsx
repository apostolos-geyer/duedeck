"use client";

import { Button, SizableText, View, XStack } from "@repo/ui";
import { Menu } from "@tamagui/lucide-icons";
import { usePathname } from "next/navigation";

interface TopBarProps {
	user: { name: string; email: string };
	onMenuPress?: () => void;
}

function getPageTitle(pathname: string): string {
	if (pathname === "/dashboard") return "Dashboard";
	if (pathname === "/calendar") return "Calendar";
	if (pathname.startsWith("/study-buddies")) return "Study Buddies";
	if (pathname.startsWith("/messages")) return "Direct messages";
	if (pathname.startsWith("/settings")) return "Settings";
	if (pathname === "/upload") return "Upload Syllabus";
	if (pathname.startsWith("/course/")) return "Course Detail";
	return "DueDeck";
}

export function TopBar({ user, onMenuPress }: TopBarProps) {
	const pathname = usePathname();
	const title = getPageTitle(pathname);
	const initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

	return (
		<XStack
			height={56}
			px="$3"
			$md={{ px: "$5" }}
			items="center"
			justify="space-between"
			borderBottomWidth={1}
			borderBottomColor="$gray5"
			bg="$background"
		>
			<XStack items="center" gap="$3">
				{/* Mobile menu button - hidden on md+ */}
				<Button
					size="$3"
					circular
					icon={<Menu size={20} />}
					display="flex"
					$md={{ display: "none" }}
					onPress={onMenuPress}
				/>
				{/* Mobile wordmark - hidden on md+ */}
				<SizableText
					size="$5"
					fontWeight="900"
					color="$purple9"
					display="flex"
					$md={{ display: "none" }}
				>
					DueDeck
				</SizableText>
				{/* Page title - always visible */}
				<SizableText size="$5" fontWeight="700">
					{title}
				</SizableText>
			</XStack>

			<View
				width={32}
				height={32}
				rounded="$10"
				bg="$purple9"
				items="center"
				justify="center"
			>
				<SizableText color="white" size="$3" fontWeight="700">
					{initial}
				</SizableText>
			</View>
		</XStack>
	);
}
