"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

interface RunState {
	runId: string;
	status: "processing" | "done" | "error";
	docId?: string;
	error?: string;
	step?: string;
}

interface ActiveRunContextValue {
	run: RunState | null;
	startRun: (runId: string) => void;
	updateRun: (patch: Partial<RunState>) => void;
	clearRun: () => void;
}

const STORAGE_KEY = "duedeck:activeRun";

const ActiveRunContext = createContext<ActiveRunContextValue | null>(null);

function loadFromStorage(): RunState | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as RunState) : null;
	} catch {
		return null;
	}
}

function saveToStorage(state: RunState | null) {
	if (typeof window === "undefined") return;
	if (state) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} else {
		localStorage.removeItem(STORAGE_KEY);
	}
}

export function ActiveRunProvider({ children }: { children: ReactNode }) {
	const [run, setRun] = useState<RunState | null>(null);

	useEffect(() => {
		setRun(loadFromStorage());
	}, []);

	useEffect(() => {
		saveToStorage(run);
	}, [run]);

	const startRun = useCallback((runId: string) => {
		setRun({ runId, status: "processing" });
	}, []);

	const updateRun = useCallback((patch: Partial<RunState>) => {
		setRun((prev) => {
			if (!prev) return prev;
			let changed = false;
			for (const key of Object.keys(patch) as (keyof RunState)[]) {
				if (patch[key] !== undefined && patch[key] !== prev[key]) {
					changed = true;
					break;
				}
			}
			if (!changed) return prev;
			return { ...prev, ...patch };
		});
	}, []);

	const clearRun = useCallback(() => {
		setRun(null);
	}, []);

	return (
		<ActiveRunContext.Provider value={{ run, startRun, updateRun, clearRun }}>
			{children}
		</ActiveRunContext.Provider>
	);
}

export function useActiveRun() {
	const ctx = useContext(ActiveRunContext);
	if (!ctx) throw new Error("useActiveRun must be inside ActiveRunProvider");
	return ctx;
}
