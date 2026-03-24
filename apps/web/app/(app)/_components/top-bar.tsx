"use client";

import { Avatar, Button, H4, SizableText, XStack } from "@repo/ui";
import { Menu, Upload } from "@tamagui/lucide-icons";
import { usePathname, useRouter } from "next/navigation";

interface TopBarProps {
	user: { name: string; email: string };
	onMenuPress?: () => void;
}

function getPageTitle(pathname: string): string {
	if (pathname === "/dashboard") return "Dashboard";
	if (pathname === "/calendar") return "Calendar";
	if (pathname.startsWith("/study-buddies")) return "Study Buddies";
	if (pathname.startsWith("/messages")) return "Messages";
	if (pathname.startsWith("/settings")) return "Settings";
	if (pathname === "/upload") return "Upload Syllabus";
	if (pathname.startsWith("/course/")) return "Course Detail";
	return "DueDeck";
}

export function TopBar({ user, onMenuPress }: TopBarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const title = getPageTitle(pathname);
	const initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

	return (
		<XStack
			height={48}
			px="$3"
			$md={{ px: "$4" }}
			items="center"
			justify="space-between"
			borderBottomWidth={2}
			borderBottomColor="$gray6"
			bg="$background"
		>
			<XStack items="center" gap="$3">
				{/* Mobile only: hamburger */}
				<Button
					size="$2"
					circular
					icon={<Menu size={18} />}
					variant="outlined"
					display="flex"
					$md={{ display: "none" }}
					onPress={onMenuPress}
				/>
				{/* Mobile only: wordmark */}
				<SizableText
					size="$5"
					fontFamily="$heading"
					fontWeight="400"
					color="$purple9"
					display="flex"
					$md={{ display: "none" }}
				>
					DueDeck
				</SizableText>
				{/* Desktop: page title */}
				<H4
					fontFamily="$heading"
					color="$color12"
					display="none"
					$md={{ display: "flex" }}
				>
					{title}
				</H4>
			</XStack>

			<XStack items="center" gap="$2">
				{/* Mobile only: upload icon */}
				<Button
					size="$2"
					circular
					icon={<Upload size={16} />}
					variant="outlined"
					display="flex"
					$md={{ display: "none" }}
					onPress={() => router.push("/upload")}
				/>
				<Avatar circular size="$2.5">
					<Avatar.Fallback
						bg="$purple9"
						items="center"
						justify="center"
					>
						<SizableText color="white" size="$2" fontWeight="700">
							{initial}
						</SizableText>
					</Avatar.Fallback>
				</Avatar>
			</XStack>
		</XStack>
	);
}
