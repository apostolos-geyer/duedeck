import { prisma } from "@repo/db";
import { getGoogleAccessTokenForUser } from "./google-access";

const GOOGLE = "google";
const API_BASE = "https://www.googleapis.com/calendar/v3";

export type GoogleSyncResult = {
	created: number;
	updated: number;
	failed: number;
	errors: string[];
};

type DeadlineWithSection = {
	id: string;
	title: string;
	type: string;
	weight: number;
	completed: boolean;
	dueDate: Date;
	section: {
		term: string;
		section: string;
		course: { code: string; name: string };
	};
};


function allDayBounds(d: Date): { start: string; end: string } {
	const start = d.toISOString().slice(0, 10);
	const endDate = new Date(d);
	endDate.setUTCDate(endDate.getUTCDate() + 1);
	const end = endDate.toISOString().slice(0, 10);
	return { start, end };
}

function buildEventPayload(deadline: DeadlineWithSection) {
	const code = deadline.section.course.code;
	const summary = `[${code}] ${deadline.title}`;
	const lines = [
		`Course: ${deadline.section.course.name} (${code})`,
		`Section: ${deadline.section.section} · Term: ${deadline.section.term}`,
		`Type: ${deadline.type}`,
		`Weight: ${deadline.weight}%`,
		`Status: ${deadline.completed ? "Completed" : "Open"}`,
	];
	const { start, end } = allDayBounds(deadline.dueDate);
	return {
		summary,
		description: lines.join("\n"),
		start: { date: start },
		end: { date: end },
		extendedProperties: { private: { duedeckDeadlineId: deadline.id } },
	};
}

async function calendarFetch(
	accessToken: string,
	path: string,
	init: RequestInit,
): Promise<Response> {
	return fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});
}

/** Push or update all enrolled deadlines on the user's primary Google calendar. */
export async function syncUserDeadlinesToGoogleCalendar(
	userId: string,
): Promise<GoogleSyncResult> {
	const accessToken = await getGoogleAccessTokenForUser(userId);

	const deadlines = await prisma.deadline.findMany({
		where: {
			section: { enrollments: { some: { userId } } },
		},
		include: { section: { include: { course: true } } },
		orderBy: { dueDate: "asc" },
	});

	const links = await prisma.calendarEventLink.findMany({
		where: { userId, provider: GOOGLE },
	});
	const linkByDeadline = new Map(links.map((l) => [l.deadlineId, l]));

	const result: GoogleSyncResult = { created: 0, updated: 0, failed: 0, errors: [] };

	for (const deadline of deadlines) {
		const payload = buildEventPayload(deadline);
		const existing = linkByDeadline.get(deadline.id);

		try {
			if (existing) {
				const res = await calendarFetch(
					accessToken,
					`/calendars/primary/events/${encodeURIComponent(existing.externalEventId)}`,
					{ method: "PATCH", body: JSON.stringify(payload) },
				);
				if (!res.ok) {
					const text = await res.text();
					throw new Error(`${res.status}: ${text}`);
				}
				result.updated++;
			} else {
				const res = await calendarFetch(accessToken, "/calendars/primary/events", {
					method: "POST",
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const text = await res.text();
					throw new Error(`${res.status}: ${text}`);
				}
				const data = (await res.json()) as { id: string };
				await prisma.calendarEventLink.create({
					data: {
						userId,
						deadlineId: deadline.id,
						provider: GOOGLE,
						externalEventId: data.id,
					},
				});
				result.created++;
			}
		} catch (e) {
			result.failed++;
			result.errors.push(e instanceof Error ? e.message : String(e));
		}
	}

	return result;
}

/** Best-effort: remove synced events from Google and local link rows. */
export async function deleteGoogleCalendarEventsForUser(userId: string): Promise<void> {
	const links = await prisma.calendarEventLink.findMany({
		where: { userId, provider: GOOGLE },
	});
	if (links.length === 0) return;

	let accessToken: string | null = null;
	try {
		accessToken = await getGoogleAccessTokenForUser(userId);
	} catch {
		accessToken = null;
	}

	if (accessToken) {
		for (const link of links) {
			try {
				const res = await calendarFetch(
					accessToken,
					`/calendars/primary/events/${encodeURIComponent(link.externalEventId)}`,
					{ method: "DELETE" },
				);
				if (!res.ok && res.status !== 404) {
					await res.text();
				}
			} catch {
				// best effort
			}
		}
	}

	await prisma.calendarEventLink.deleteMany({
		where: { userId, provider: GOOGLE },
	});
}
