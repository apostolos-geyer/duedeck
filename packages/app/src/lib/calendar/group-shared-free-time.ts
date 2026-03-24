import { prisma } from "@repo/db";
import { getGoogleAccessTokenForUser } from "./google-access";
import {
  type BusyInterval,
  busyToFree,
  fetchGoogleBusyIntervals,
  intersectFree,
} from "./google-busy";

const MAX_WINDOWS_PER_BUDDY = 40;

export type SharedFreeWindow = { start: string; end: string };

export type BuddySharedFreeTime = {
  userId: string;
  name: string;
  hasGoogleCalendar: boolean;
  sharedFreeWindows: SharedFreeWindow[];
  totalSharedMinutes: number;
};

export type GroupSharedFreeTimeResult = {
  rangeStart: string;
  rangeEnd: string;
  viewerHasGoogleCalendar: boolean;
  viewerCalendarError: string | null;
  buddies: BuddySharedFreeTime[];
};

async function tryViewerGoogleToken(userId: string): Promise<{
  token: string | null;
  error: string | null;
}> {
  try {
    const token = await getGoogleAccessTokenForUser(userId);
    return { token, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "calendar_unavailable";
    return { token: null, error: message };
  }
}

async function tryBuddyGoogleToken(userId: string): Promise<string | null> {
  try {
    return await getGoogleAccessTokenForUser(userId);
  } catch {
    return null;
  }
}

function intervalsToWindows(intervals: BusyInterval[]): SharedFreeWindow[] {
  return intervals.map((i) => ({
    start: new Date(i.startMs).toISOString(),
    end: new Date(i.endMs).toISOString(),
  }));
}

function totalMinutes(intervals: BusyInterval[]): number {
  return Math.round(
    intervals.reduce((acc, i) => acc + (i.endMs - i.startMs) / 60_000, 0),
  );
}

/**
 * Next 7 days from `now`, pairwise free overlap between the viewer and each group member
 * (Google Calendar connected). Uses primary calendar busy times from the Calendar API.
 */
export async function computeGroupSharedFreeTime(
  viewerUserId: string,
  groupId: string,
): Promise<GroupSharedFreeTimeResult> {
  const membership = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: viewerUserId },
    },
  });
  if (!membership) {
    throw new Error("not_group_member");
  }

  const members = await prisma.studyGroupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true } } },
  });

  const now = Date.now();
  const rangeStartMs = now;
  const rangeEndMs = now + 7 * 24 * 60 * 60 * 1000;
  const rangeStart = new Date(rangeStartMs);
  const rangeEnd = new Date(rangeEndMs);

  const { token: viewerToken, error: viewerCalendarError } =
    await tryViewerGoogleToken(viewerUserId);

  let viewerFree: BusyInterval[] = [];
  if (viewerToken) {
    const viewerBusy = await fetchGoogleBusyIntervals(
      viewerToken,
      rangeStart,
      rangeEnd,
    );
    viewerFree = busyToFree(viewerBusy, rangeStartMs, rangeEndMs);
  }

  const others = members.filter((m) => m.userId !== viewerUserId);

  const buddies: BuddySharedFreeTime[] = await Promise.all(
    others.map(async (m) => {
      const buddyToken = await tryBuddyGoogleToken(m.user.id);
      const hasGoogle = buddyToken !== null;

      if (!viewerToken || !buddyToken) {
        return {
          userId: m.user.id,
          name: m.user.name,
          hasGoogleCalendar: hasGoogle,
          sharedFreeWindows: [] as SharedFreeWindow[],
          totalSharedMinutes: 0,
        };
      }

      const buddyBusy = await fetchGoogleBusyIntervals(
        buddyToken,
        rangeStart,
        rangeEnd,
      );
      const buddyFree = busyToFree(buddyBusy, rangeStartMs, rangeEndMs);
      const shared = intersectFree(viewerFree, buddyFree);

      return {
        userId: m.user.id,
        name: m.user.name,
        hasGoogleCalendar: true,
        sharedFreeWindows: intervalsToWindows(shared).slice(
          0,
          MAX_WINDOWS_PER_BUDDY,
        ),
        totalSharedMinutes: totalMinutes(shared),
      };
    }),
  );

  buddies.sort((a, b) => b.totalSharedMinutes - a.totalSharedMinutes);

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    viewerHasGoogleCalendar: viewerToken !== null,
    viewerCalendarError: viewerCalendarError,
    buddies,
  };
}
