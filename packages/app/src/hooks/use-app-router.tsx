"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function useAppRouter() {
	const router = useRouter();

	return useMemo(
		() => ({
			push: (path: string) => router.push(path),
			replace: (path: string) => router.replace(path),
			back: () => router.back(),
		}),
		[router],
	);
}
