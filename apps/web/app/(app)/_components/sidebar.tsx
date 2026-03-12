"use client";

import { Button, SizableText, View, XStack, YStack } from "@repo/ui";
import {
	Calendar,
	LayoutDashboard,
	Settings,
	Upload,
	Users,
} from "@tamagui/lucide-icons";
import { usePathname, useRouter } from "next/navigation";
import { NavItem } from "./nav-item";

interface SidebarProps {
	user: { name: string; email: string };
	forceShow?: boolean;
	onNavigate?: () => void;
}

export function Sidebar({ user, forceShow, onNavigate }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();

	const initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

	function navigate(href: string) {
		router.push(href);
		onNavigate?.();
	}

	return (
		<YStack
			width={240}
			height="100%"
			bg="$gray2"
			borderRightWidth={1}
			borderRightColor="$gray5"
			p="$4"
			display={forceShow ? "flex" : "none"}
			$md={{ display: "flex" }}
		>
			{/* Top section */}
			<SizableText size="$8" fontWeight="900" color="$purple9">
				DueDeck
			</SizableText>

			<YStack height="$3" />

			<Button
				theme="purple"
				icon={<Upload size={18} />}
				width="100%"
				onPress={() => navigate("/upload")}
			>
				Upload Syllabus
			</Button>

			{/* Middle section — nav items */}
			<YStack flex={1} gap="$1" mt="$4">
				<NavItem
					icon={
						<LayoutDashboard
							size={20}
							color={pathname === "/dashboard" ? "$purple9" : "$gray10"}
						/>
					}
					label="Dashboard"
					href="/dashboard"
					active={pathname === "/dashboard"}
				/>
				<NavItem
					icon={
						<Calendar
							size={20}
							color={pathname === "/calendar" ? "$purple9" : "$gray10"}
						/>
					}
					label="Calendar"
					href="/calendar"
					active={pathname === "/calendar"}
				/>
				<NavItem
					icon={
						<Users
							size={20}
							color={
								pathname.startsWith("/study-buddies") ? "$purple9" : "$gray10"
							}
						/>
					}
					label="Study Buddies"
					href="/study-buddies"
					active={pathname.startsWith("/study-buddies")}
				/>
				<NavItem
					icon={
						<Settings
							size={20}
							color={
								pathname.startsWith("/settings") ? "$purple9" : "$gray10"
							}
						/>
					}
					label="Settings"
					href="/settings"
					active={pathname.startsWith("/settings")}
				/>
			</YStack>

			{/* Bottom section — user info */}
			<XStack gap="$3" items="center">
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
				<YStack flex={1} overflow="hidden">
					<SizableText size="$3" fontWeight="600" numberOfLines={1}>
						{user.name}
					</SizableText>
					<SizableText size="$2" color="$gray10" numberOfLines={1}>
						{user.email}
					</SizableText>
				</YStack>
			</XStack>
		</YStack>
	);
}
