"use client";

import { XStack } from "@repo/ui";
import {
	Calendar,
	LayoutDashboard,
	Settings,
	Users,
} from "@tamagui/lucide-icons";
import { usePathname } from "next/navigation";
import { BottomTabItem } from "./nav-item";

const TABS = [
	{ icon: LayoutDashboard, label: "Home", href: "/dashboard" },
	{ icon: Calendar, label: "Calendar", href: "/calendar" },
	{ icon: Users, label: "Study", href: "/study-buddies" },
	{ icon: Settings, label: "Settings", href: "/settings" },
] as const;

export function BottomTabBar() {
	const pathname = usePathname();

	function isActive(href: string) {
		if (href === "/dashboard") return pathname === "/dashboard";
		return pathname.startsWith(href);
	}

	return (
		<XStack
			height={56}
			borderTopWidth={2}
			borderTopColor="$gray6"
			bg="$background"
			items="center"
			// Mobile only
			display="flex"
			$md={{ display: "none" }}
		>
			{TABS.map((tab) => {
				const active = isActive(tab.href);
				return (
					<BottomTabItem
						key={tab.href}
						icon={
							<tab.icon
								size={20}
								color={active ? "$purple9" : "$gray10"}
							/>
						}
						label={tab.label}
						href={tab.href}
						active={active}
					/>
				);
			})}
		</XStack>
	);
}
