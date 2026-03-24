"use client";

import { Avatar, H4, Separator, View, YStack } from "@repo/ui";
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

const NAV_ITEMS = [
	{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
	{ icon: Calendar, label: "Calendar", href: "/calendar" },
	{ icon: Users, label: "Study Buddies", href: "/study-buddies" },
	{ icon: Settings, label: "Settings", href: "/settings" },
] as const;

export function Sidebar({ user, forceShow, onNavigate }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const _initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

	function isActive(href: string) {
		if (href === "/dashboard") return pathname === "/dashboard";
		return pathname.startsWith(href);
	}

	return (
		<YStack
			width={64}
			height="100%"
			bg="$gray2"
			borderRightWidth={2}
			borderRightColor="$gray6"
			items="center"
			py="$3"
			gap="$2"
			display={forceShow ? "flex" : "none"}
			$md={{ display: "flex" }}
		>
			{/* Logo */}
			<H4
				fontFamily="$heading"
				color="$purple9"
				mb="$2"
				select="none"
			>
				DD
			</H4>

			{/* Upload button */}
			<View
				width={40}
				height={40}
				items="center"
				justify="center"
				bg="$purple9"
				rounded={0}
				cursor="pointer"
				hoverStyle={{ bg: "$purple10" }}
				pressStyle={{ bg: "$purple11" }}
				onPress={() => {
					router.push("/upload");
					onNavigate?.();
				}}
			>
				<Upload size={18} color="white" />
			</View>

			<Separator my="$2" width={32} />

			{/* Nav items */}
			<YStack flex={1} gap="$1" width="100%">
				{NAV_ITEMS.map((item) => {
					const active = isActive(item.href);
					return (
						<NavItem
							key={item.href}
							icon={
								<item.icon
									size={20}
									color={active ? "$purple9" : "$gray10"}
								/>
							}
							label={item.label}
							href={item.href}
							active={active}
						/>
					);
				})}
			</YStack>

			{/* User avatar */}
			<Avatar circular size="$3">
				<Avatar.Fallback
					bg="$purple9"
					items="center"
					justify="center"
				/>
			</Avatar>
		</YStack>
	);
}
