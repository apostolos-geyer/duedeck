/** Busy intervals from Google Calendar `events.list` (ms since epoch, end exclusive semantics aligned per interval). */

export type BusyInterval = { startMs: number; endMs: number };

type GoogleEventItem = {
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
};

function parseEventBounds(item: GoogleEventItem): BusyInterval | null {
  if (item.status === "cancelled") return null;
  if (item.transparency === "transparent") return null;

  const s = item.start;
  const e = item.end;
  if (!s || !e) return null;

  if (s.dateTime && e.dateTime) {
    const startMs = Date.parse(s.dateTime);
    const endMs = Date.parse(e.dateTime);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs)
      return null;
    return { startMs, endMs };
  }

  if (s.date && e.date) {
    // All-day: `end.date` is exclusive (Google). Interpret as UTC midnight boundaries.
    const startMs = Date.parse(`${s.date}T00:00:00.000Z`);
    const endMs = Date.parse(`${e.date}T00:00:00.000Z`);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs)
      return null;
    return { startMs, endMs };
  }

  return null;
}

export function mergeBusyIntervals(intervals: BusyInterval[]): BusyInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
  const out: BusyInterval[] = [];
  let cur = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n.startMs <= cur.endMs) {
      cur = { startMs: cur.startMs, endMs: Math.max(cur.endMs, n.endMs) };
    } else {
      out.push(cur);
      cur = n;
    }
  }
  out.push(cur);
  return out;
}

/** Complement of busy within [rangeStartMs, rangeEndMs). */
export function busyToFree(
  busy: BusyInterval[],
  rangeStartMs: number,
  rangeEndMs: number,
): BusyInterval[] {
  const clipped = busy
    .filter((b) => b.endMs > rangeStartMs && b.startMs < rangeEndMs)
    .map((b) => ({
      startMs: Math.max(b.startMs, rangeStartMs),
      endMs: Math.min(b.endMs, rangeEndMs),
    }));
  const merged = mergeBusyIntervals(clipped);
  const free: BusyInterval[] = [];
  let cursor = rangeStartMs;
  for (const b of merged) {
    if (b.startMs > cursor) {
      free.push({ startMs: cursor, endMs: b.startMs });
    }
    cursor = Math.max(cursor, b.endMs);
  }
  if (cursor < rangeEndMs) {
    free.push({ startMs: cursor, endMs: rangeEndMs });
  }
  return free;
}

export function intersectFree(
  a: BusyInterval[],
  b: BusyInterval[],
): BusyInterval[] {
  const out: BusyInterval[] = [];
  for (const ia of a) {
    for (const ib of b) {
      const s = Math.max(ia.startMs, ib.startMs);
      const e = Math.min(ia.endMs, ib.endMs);
      if (e > s) out.push({ startMs: s, endMs: e });
    }
  }
  return mergeBusyIntervals(out);
}

const EVENTS_BASE =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export async function fetchGoogleBusyIntervals(
  accessToken: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<BusyInterval[]> {
  const busy: BusyInterval[] = [];
  let pageToken: string | undefined;

  const timeMin = rangeStart.toISOString();
  const timeMax = rangeEnd.toISOString();

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${EVENTS_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Google Calendar events.list failed (${res.status}): ${text}`,
      );
    }

    const data = (await res.json()) as {
      items?: GoogleEventItem[];
      nextPageToken?: string;
    };

    for (const item of data.items ?? []) {
      const interval = parseEventBounds(item);
      if (interval) busy.push(interval);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return mergeBusyIntervals(busy);
}
