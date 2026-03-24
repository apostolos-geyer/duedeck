import { randomUUID } from "node:crypto";
import { ORPCError, os } from "@orpc/server";
import { prisma } from "@repo/db";
import { createPresignedGet, createPresignedUpload } from "@repo/storage";
import { type } from "arktype";
import { getRun, resumeHook, start } from "workflow/api";
import {
  decryptToken,
  deleteGoogleCalendarEventsForUser,
  isValidProvider,
  revokeToken,
  syncUserDeadlinesToGoogleCalendar,
} from "../lib/calendar";
import { computeGroupSharedFreeTime } from "../lib/calendar/group-shared-free-time";
import { assertUsersShareStudyGroup } from "../lib/study-group-peers";
import {
  type ProgressEvent,
  parseDocumentWorkflow,
} from "../workflows/parse-document";
import { syllabusExtractionSchema } from "../workflows/parse-document/extraction-schema";

export type { ProgressEvent };

type Session = {
  user: { id: string; name: string; email: string };
};

export function createRouter(getSession: () => Promise<Session | null>) {
  const base = os.use(async ({ next }) => {
    const session = await getSession();
    return next({ context: { session } });
  });

  const authed = base.use(async ({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context: { userId: context.session.user.id } });
  });

  // ── uploads ──────────────────────────────────────────────

  const presignedUpload = base
    .input(
      type({
        filename: "string",
        contentType: "string",
        "maxSize?": "number",
      }),
    )
    .handler(async ({ input }) => {
      const ext = input.filename.split(".").pop() ?? "bin";
      const key = `${randomUUID()}.${ext}`;

      const result = await createPresignedUpload({
        key,
        contentType: input.contentType,
        maxSize: input.maxSize,
      });

      return result;
    });

  const presignedGet = base
    .input(type({ key: "string" }))
    .handler(async ({ input }) => {
      return createPresignedGet({ key: input.key });
    });

  // ── documents ────────────────────────────────────────────

  const startDocument = authed
    .input(
      type({
        s3Key: "string",
        "sectionId?": "string",
        filename: "string",
        "forceFullReprocess?": "boolean",
      }),
    )
    .handler(async ({ input, context }) => {
      const run = await start(parseDocumentWorkflow, [
        { ...input, uploadedById: context.userId },
      ]);

      return { runId: run.runId };
    });

  const streamDocument = base
    .input(
      type({
        runId: "string",
      }),
    )
    .handler(async function* ({ input }) {
      const run = getRun(input.runId);
      const reader = run.getReadable<ProgressEvent>().getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    });

  const getDocument = authed
    .input(type({ docId: "string" }))
    .handler(async ({ input, context }) => {
      const doc = await prisma.document.findUniqueOrThrow({
        where: { id: input.docId },
        include: {
          section: {
            include: {
              course: { include: { school: true } },
              deadlines: { orderBy: { dueDate: "asc" } },
              gradeWeights: true,
              enrollments: {
                where: { userId: context.userId },
                take: 1,
              },
            },
          },
        },
      });
      return doc;
    });

  const confirmDocument = authed
    .input(type({ hookToken: "string", data: syllabusExtractionSchema }))
    .handler(async ({ input }) => {
      await resumeHook(input.hookToken, {
        action: "confirm" as const,
        data: input.data,
      });
      return { ok: true };
    });

  const cancelDocument = authed
    .input(type({ hookToken: "string" }))
    .handler(async ({ input }) => {
      await resumeHook(input.hookToken, { action: "cancel" as const });
      return { ok: true };
    });

  const cancelActiveDocuments = authed.handler(async ({ context }) => {
    await prisma.document.updateMany({
      where: { uploadedById: context.userId, status: "processing" },
      data: { status: "cancelled" },
    });
    return { ok: true };
  });

  // ── users ────────────────────────────────────────────────

  const me = authed.handler(async ({ context }) => {
    return prisma.user.findUniqueOrThrow({
      where: { id: context.userId },
      include: { calendarConnections: true, reminderPreferences: true },
    });
  });

  const userPeerProfile = authed
    .input(type({ userId: "string" }))
    .handler(async ({ context, input }) => {
      if (input.userId === context.userId) {
        return prisma.user.findUniqueOrThrow({
          where: { id: context.userId },
          select: { id: true, name: true, image: true, email: true },
        });
      }
      try {
        await assertUsersShareStudyGroup(context.userId, input.userId);
      } catch {
        throw new ORPCError("FORBIDDEN", { message: "not_a_peer" });
      }
      const peer = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, image: true, email: true },
      });
      if (!peer) {
        throw new ORPCError("NOT_FOUND", { message: "user_not_found" });
      }
      return peer;
    });

  // ── schools ──────────────────────────────────────────────

  const schoolList = base.handler(async () => {
    return prisma.school.findMany();
  });

  // ── courses ──────────────────────────────────────────────

  const courseList = base
    .input(type({ "schoolId?": "string", "search?": "string" }))
    .handler(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.schoolId) where.schoolId = input.schoolId;
      if (input.search) {
        where.OR = [
          { code: { contains: input.search, mode: "insensitive" } },
          { name: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const courses = await prisma.course.findMany({
        where,
        include: {
          _count: { select: { sections: true } },
          sections: {
            select: {
              _count: { select: { enrollments: true, documents: true } },
            },
          },
        },
      });

      const courseIds = courses.map((c) => c.id);
      const groupCountRows =
        courseIds.length === 0
          ? []
          : await prisma.studyGroup.groupBy({
              by: ["courseId", "isPublic"],
              where: { courseId: { in: courseIds }, sectionId: null },
              _count: { _all: true },
            });

      const customStudyGroupCounts = new Map<
        string,
        { public: number; private: number }
      >();
      for (const id of courseIds) {
        customStudyGroupCounts.set(id, { public: 0, private: 0 });
      }
      for (const row of groupCountRows) {
        const cur = customStudyGroupCounts.get(row.courseId);
        if (!cur) continue;
        if (row.isPublic) cur.public = row._count._all;
        else cur.private = row._count._all;
      }

      return courses.map((c) => {
        const totalEnrollments = c.sections.reduce(
          (sum, s) => sum + s._count.enrollments,
          0,
        );
        const totalDocuments = c.sections.reduce(
          (sum, s) => sum + s._count.documents,
          0,
        );
        const { sections: _sections, ...rest } = c;
        return {
          ...rest,
          totalEnrollments,
          totalDocuments,
          customStudyGroupCounts:
            customStudyGroupCounts.get(c.id) ?? { public: 0, private: 0 },
        };
      });
    });

  const courseGet = base
    .input(type({ courseId: "string" }))
    .handler(async ({ input }) => {
      return prisma.course.findUniqueOrThrow({
        where: { id: input.courseId },
        include: { sections: true },
      });
    });

  // ── sections ─────────────────────────────────────────────

  const sectionList = base
    .input(type({ courseId: "string", "term?": "string" }))
    .handler(async ({ input }) => {
      const where: Record<string, unknown> = { courseId: input.courseId };
      if (input.term) where.term = input.term;

      return prisma.courseSection.findMany({
        where,
        include: {
          _count: { select: { enrollments: true, documents: true } },
        },
      });
    });

  const sectionGet = base
    .input(type({ sectionId: "string" }))
    .handler(async ({ input }) => {
      return prisma.courseSection.findUnique({
        where: { id: input.sectionId },
        include: {
          course: { include: { school: true } },
          deadlines: true,
          gradeWeights: true,
          documents: {
            where: { status: "confirmed" },
            orderBy: { uploadedAt: "desc" },
            take: 1,
            select: { id: true, filename: true, s3Key: true },
          },
        },
      });
    });

  const sectionEnrolled = authed.handler(async ({ context }) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: context.userId },
      include: { section: { include: { course: true } } },
    });

    return enrollments.map((e) => ({
      ...e.section,
      course: e.section.course,
    }));
  });

  /** Classmates in a section (for class chat → study group invites). Caller must be enrolled. */
  const sectionClassmates = authed
    .input(type({ sectionId: "string" }))
    .handler(async ({ context, input }) => {
      const myEn = await prisma.enrollment.findUnique({
        where: {
          userId_sectionId: {
            userId: context.userId,
            sectionId: input.sectionId,
          },
        },
      });
      if (!myEn) {
        throw new ORPCError("FORBIDDEN", { message: "enrollment_required" });
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { sectionId: input.sectionId },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });

      const out = enrollments.map((e) => ({
        userId: e.userId,
        name: e.user.name,
        image: e.user.image,
      }));
      out.sort((a, b) => a.name.localeCompare(b.name));
      return out;
    });

  // ── deadlines ────────────────────────────────────────────

  const deadlineList = authed
    .input(type({ sectionId: "string" }))
    .handler(async ({ input }) => {
      return prisma.deadline.findMany({
        where: { sectionId: input.sectionId },
        orderBy: { dueDate: "asc" },
      });
    });

  const deadlineUpcoming = authed
    .input(type({ "days?": "number" }))
    .handler(async ({ context, input }) => {
      const days = input.days ?? 14;
      const pastWindow = new Date(Date.now() - 86400000);
      const futureWindow = new Date(Date.now() + days * 86400000);

      return prisma.deadline.findMany({
        where: {
          section: {
            enrollments: { some: { userId: context.userId } },
          },
          dueDate: { gte: pastWindow, lte: futureWindow },
          completed: false,
        },
        include: { section: { include: { course: true } } },
        orderBy: { dueDate: "asc" },
      });
    });

  /** Per enrolled section: true when the course has deadlines and the latest due date is in the past. */
  const deadlineCourseTermsEnded = authed.handler(async ({ context }) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: context.userId },
      select: { sectionId: true },
    });
    const sectionIds = [...new Set(enrollments.map((e) => e.sectionId))];
    const out: Record<string, boolean> = Object.fromEntries(
      sectionIds.map((id) => [id, false]),
    );
    if (sectionIds.length === 0) return out;

    const now = new Date();
    const groups = await prisma.deadline.groupBy({
      by: ["sectionId"],
      where: { sectionId: { in: sectionIds } },
      _max: { dueDate: true },
      _count: { _all: true },
    });

    for (const g of groups) {
      const latest = g._max.dueDate;
      if (g._count._all > 0 && latest && latest.getTime() < now.getTime()) {
        out[g.sectionId] = true;
      }
    }
    return out;
  });

  /** All deadlines in [from, to] for enrolled sections (includes completed). ISO 8601 strings; max ~1 year span. */
  const deadlineInRange = authed
    .input(type({ from: "string", to: "string" }))
    .handler(async ({ context, input }) => {
      const from = new Date(input.from);
      const to = new Date(input.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid date range" });
      }
      if (from > to) {
        throw new ORPCError("BAD_REQUEST", {
          message: "from must be before to",
        });
      }
      const maxMs = 366 * 86400000;
      if (to.getTime() - from.getTime() > maxMs) {
        throw new ORPCError("BAD_REQUEST", { message: "Date range too large" });
      }

      return prisma.deadline.findMany({
        where: {
          section: {
            enrollments: { some: { userId: context.userId } },
          },
          dueDate: { gte: from, lte: to },
        },
        include: { section: { include: { course: true } } },
        orderBy: { dueDate: "asc" },
      });
    });

  const deadlineToggleComplete = authed
    .input(type({ deadlineId: "string", completed: "boolean" }))
    .handler(async ({ context, input }) => {
      const deadline = await prisma.deadline.findUniqueOrThrow({
        where: { id: input.deadlineId },
        include: {
          section: {
            include: { enrollments: { where: { userId: context.userId } } },
          },
        },
      });

      if (deadline.section.enrollments.length === 0) {
        throw new ORPCError("FORBIDDEN");
      }

      return prisma.deadline.update({
        where: { id: input.deadlineId },
        data: { completed: input.completed },
      });
    });

  // ── gradeWeights ─────────────────────────────────────────

  const gradeWeightList = base
    .input(type({ sectionId: "string" }))
    .handler(async ({ input }) => {
      return prisma.gradeWeight.findMany({
        where: { sectionId: input.sectionId },
      });
    });

  // ── enrollments ──────────────────────────────────────────

  const enroll = authed
    .input(type({ sectionId: "string" }))
    .handler(async ({ context, input }) => {
      return prisma.enrollment.upsert({
        where: {
          userId_sectionId: {
            userId: context.userId,
            sectionId: input.sectionId,
          },
        },
        create: { userId: context.userId, sectionId: input.sectionId },
        update: {},
      });
    });

  const unenroll = authed
    .input(type({ sectionId: "string" }))
    .handler(async ({ context, input }) => {
      await prisma.studyGroupMember.deleteMany({
        where: {
          userId: context.userId,
          group: { sectionId: input.sectionId },
        },
      });
      return prisma.enrollment.delete({
        where: {
          userId_sectionId: {
            userId: context.userId,
            sectionId: input.sectionId,
          },
        },
      });
    });

  const studyGroupListInclude = {
    _count: { select: { members: true } },
    members: {
      include: { user: { select: { name: true, image: true } } },
    },
  } as const;

  type StudyGroupActivityType =
    | "member_joined"
    | "member_left"
    | "member_removed";

  async function logStudyGroupActivity(
    groupId: string,
    type: StudyGroupActivityType,
    subjectUserId: string,
    actorUserId: string | null,
  ) {
    await prisma.studyGroupActivity.create({
      data: {
        groupId,
        type,
        subjectUserId,
        actorUserId,
      },
    });
  }

  /** Custom study groups only (`sectionId` null). Class section chats cannot be managed here. */
  async function assertCanManageCustomStudyGroup(
    groupId: string,
    userId: string,
  ) {
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });
    if (!group || group.sectionId !== null) {
      throw new ORPCError("BAD_REQUEST", { message: "custom_group_only" });
    }
    const membership = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new ORPCError("FORBIDDEN", { message: "not_a_member" });
    }
    if (group.createdById !== null && group.createdById !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "not_group_owner" });
    }
    return group;
  }

  /** Only the recorded creator may delete; custom groups only. */
  async function assertCreatorCanDeleteStudyGroup(
    groupId: string,
    userId: string,
  ) {
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
    });
    if (!group || group.sectionId !== null) {
      throw new ORPCError("BAD_REQUEST", { message: "custom_group_only" });
    }
    if (!group.createdById) {
      throw new ORPCError("FORBIDDEN", {
        message: "creator_unknown_cannot_delete",
      });
    }
    if (group.createdById !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "only_creator_can_delete" });
    }
  }

  // ── studyGroups ──────────────────────────────────────────

  const studyGroupList = base
    .input(type({ courseId: "string", "customOnly?": "boolean" }))
    .handler(async ({ input, context }) => {
      if (input.customOnly && !context.session) {
        throw new ORPCError("UNAUTHORIZED");
      }
      return prisma.studyGroup.findMany({
        where: {
          courseId: input.courseId,
          ...(input.customOnly
            ? {
                /** Browse lists public groups only; private groups are invite-only. */
                sectionId: null,
                isPublic: true,
              }
            : {}),
        },
        include: studyGroupListInclude,
      });
    });

  const studyGroupGet = authed
    .input(type({ groupId: "string" }))
    .handler(async ({ context, input }) => {
      const member = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: context.userId,
          },
        },
      });
      if (!member) {
        throw new ORPCError("FORBIDDEN", { message: "not_a_member" });
      }
      return prisma.studyGroup.findUniqueOrThrow({
        where: { id: input.groupId },
        include: studyGroupListInclude,
      });
    });

  const studyGroupCreate = authed
    .input(
      type({
        courseId: "string",
        name: "string",
        "maxMembers?": "number",
        "isPublic?": "boolean",
      }),
    )
    .handler(async ({ context, input }) => {
      const enrolledInCourse = await prisma.enrollment.findFirst({
        where: {
          userId: context.userId,
          section: { courseId: input.courseId },
        },
      });
      if (!enrolledInCourse) {
        throw new ORPCError("FORBIDDEN", {
          message: "enroll_in_course_first",
        });
      }
      const name = input.name.trim();
      if (!name) {
        throw new ORPCError("BAD_REQUEST", { message: "empty_name" });
      }
      const rawMax = input.maxMembers ?? 6;
      const maxMembers = Math.min(250, Math.max(2, Math.floor(rawMax)));
      const g = await prisma.studyGroup.create({
        data: {
          courseId: input.courseId,
          name,
          maxMembers,
          isPublic: input.isPublic ?? true,
          createdById: context.userId,
          members: {
            create: { userId: context.userId },
          },
        },
        include: studyGroupListInclude,
      });
      await logStudyGroupActivity(g.id, "member_joined", context.userId, null);
      return g;
    });

  /** Custom study groups only (`sectionId` null); class chats reject via assertCanManageCustomStudyGroup. */
  const studyGroupUpdate = authed
    .input(
      type({
        groupId: "string",
        "name?": "string",
        "maxMembers?": "number",
        "isPublic?": "boolean",
      }),
    )
    .handler(async ({ context, input }) => {
      const g = await assertCanManageCustomStudyGroup(
        input.groupId,
        context.userId,
      );
      const data: {
        name?: string;
        maxMembers?: number;
        isPublic?: boolean;
      } = {};
      if (input.name !== undefined) {
        const name = input.name.trim();
        if (!name) {
          throw new ORPCError("BAD_REQUEST", { message: "empty_name" });
        }
        data.name = name;
      }
      if (input.maxMembers !== undefined) {
        const maxMembers = Math.min(
          250,
          Math.max(2, Math.floor(input.maxMembers)),
        );
        if (maxMembers < g._count.members) {
          throw new ORPCError("BAD_REQUEST", {
            message: "max_members_below_current",
          });
        }
        data.maxMembers = maxMembers;
      }
      if (input.isPublic !== undefined) {
        data.isPublic = input.isPublic;
      }
      if (Object.keys(data).length === 0) {
        return prisma.studyGroup.findUniqueOrThrow({
          where: { id: input.groupId },
          include: studyGroupListInclude,
        });
      }
      return prisma.studyGroup.update({
        where: { id: input.groupId },
        data,
        include: studyGroupListInclude,
      });
    });

  /** Kick a member from a custom study group only; not used for section class chats. */
  const studyGroupRemoveMember = authed
    .input(type({ groupId: "string", userId: "string" }))
    .handler(async ({ context, input }) => {
      await assertCanManageCustomStudyGroup(input.groupId, context.userId);
      if (input.userId === context.userId) {
        throw new ORPCError("BAD_REQUEST", { message: "use_leave" });
      }
      const target = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: input.userId,
          },
        },
      });
      if (!target) {
        throw new ORPCError("NOT_FOUND", { message: "member_not_found" });
      }
      await logStudyGroupActivity(
        input.groupId,
        "member_removed",
        input.userId,
        context.userId,
      );
      await prisma.studyGroupMember.delete({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: input.userId,
          },
        },
      });
      return { ok: true as const };
    });

  /** Permanently delete a custom study group. Only `createdById` may do this. */
  const studyGroupDelete = authed
    .input(type({ groupId: "string" }))
    .handler(async ({ context, input }) => {
      await assertCreatorCanDeleteStudyGroup(input.groupId, context.userId);
      await prisma.studyGroup.delete({ where: { id: input.groupId } });
      return { ok: true as const };
    });

  const studyGroupMyCustomGroups = authed.handler(async ({ context }) => {
    const rows = await prisma.studyGroupMember.findMany({
      where: {
        userId: context.userId,
        group: { sectionId: null },
      },
      include: {
        group: {
          include: {
            ...studyGroupListInclude,
            course: {
              include: {
                school: { select: { shortName: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    return rows.map((r) => ({
      joinedAt: r.joinedAt,
      group: r.group,
    }));
  });

  const studyGroupEnsureClassChat = authed
    .input(type({ sectionId: "string" }))
    .handler(async ({ context, input }) => {
      const userId = context.userId;
      const section = await prisma.courseSection.findFirst({
        where: { id: input.sectionId },
        include: {
          course: true,
          enrollments: { where: { userId }, take: 1 },
        },
      });
      if (!section) {
        throw new ORPCError("NOT_FOUND", { message: "section_not_found" });
      }
      if (section.enrollments.length === 0) {
        throw new ORPCError("FORBIDDEN", { message: "enrollment_required" });
      }

      let group = await prisma.studyGroup.findUnique({
        where: { sectionId: section.id },
        include: studyGroupListInclude,
      });

      if (!group) {
        group = await prisma.studyGroup.create({
          data: {
            courseId: section.courseId,
            sectionId: section.id,
            name: `${section.course.code} · ${section.term} · Sec ${section.section}`,
            maxMembers: 500,
          },
          include: studyGroupListInclude,
        });
      }

      const hadMember = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: { groupId: group.id, userId },
        },
      });
      await prisma.studyGroupMember.upsert({
        where: {
          groupId_userId: { groupId: group.id, userId },
        },
        create: { groupId: group.id, userId },
        update: {},
      });
      if (!hadMember) {
        await logStudyGroupActivity(group.id, "member_joined", userId, null);
      }

      return prisma.studyGroup.findUniqueOrThrow({
        where: { id: group.id },
        include: studyGroupListInclude,
      });
    });

  const studyGroupMyClassChats = authed.handler(async ({ context }) => {
    const rows = await prisma.enrollment.findMany({
      where: { userId: context.userId },
      orderBy: { enrolledAt: "desc" },
      include: {
        section: {
          include: {
            course: { include: { school: true } },
            classChat: { include: studyGroupListInclude },
          },
        },
      },
    });

    return rows.map((e) => ({
      sectionId: e.sectionId,
      term: e.section.term,
      sectionCode: e.section.section,
      courseCode: e.section.course.code,
      courseName: e.section.course.name,
      schoolShortName: e.section.course.school.shortName,
      classChat: e.section.classChat,
    }));
  });

  const studyGroupJoin = authed
    .input(type({ groupId: "string" }))
    .handler(async ({ context, input }) => {
      const group = await prisma.studyGroup.findUnique({
        where: { id: input.groupId },
        include: { _count: { select: { members: true } } },
      });
      if (!group) {
        throw new ORPCError("NOT_FOUND", { message: "group_not_found" });
      }
      if (!group.sectionId && !group.isPublic) {
        const existing = await prisma.studyGroupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: input.groupId,
              userId: context.userId,
            },
          },
        });
        if (!existing) {
          throw new ORPCError("FORBIDDEN", { message: "private_group" });
        }
        return existing;
      }
      if (group.sectionId) {
        const en = await prisma.enrollment.findUnique({
          where: {
            userId_sectionId: {
              userId: context.userId,
              sectionId: group.sectionId,
            },
          },
        });
        if (!en) {
          throw new ORPCError("FORBIDDEN", { message: "enrollment_required" });
        }
      } else if (group._count.members >= group.maxMembers) {
        throw new ORPCError("BAD_REQUEST", { message: "group_full" });
      }

      try {
        const row = await prisma.studyGroupMember.create({
          data: { groupId: input.groupId, userId: context.userId },
        });
        await logStudyGroupActivity(
          input.groupId,
          "member_joined",
          context.userId,
          null,
        );
        return row;
      } catch {
        return prisma.studyGroupMember.findUniqueOrThrow({
          where: {
            groupId_userId: {
              groupId: input.groupId,
              userId: context.userId,
            },
          },
        });
      }
    });

  const studyGroupLeave = authed
    .input(type({ groupId: "string" }))
    .handler(async ({ context, input }) => {
      const existing = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: context.userId,
          },
        },
      });
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "not_a_member" });
      }
      await logStudyGroupActivity(
        input.groupId,
        "member_left",
        context.userId,
        null,
      );
      return prisma.studyGroupMember.delete({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: context.userId,
          },
        },
      });
    });

  /**
   * Add section classmates to a custom study group (same course). Inviter must be in the group
   * and enrolled in the section. Skips invalid ids, users not in the section, and members when full.
   */
  const studyGroupInviteFromSection = authed
    .input(
      type({
        groupId: "string",
        sectionId: "string",
        userIds: type("string[]"),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.userId;
      const uniqueIds = [...new Set(input.userIds)].filter(
        (id) => id !== userId,
      );
      if (uniqueIds.length > 40) {
        throw new ORPCError("BAD_REQUEST", { message: "too_many_invites" });
      }

      const [group, section, inviterMembership] = await Promise.all([
        prisma.studyGroup.findUnique({
          where: { id: input.groupId },
          include: { _count: { select: { members: true } } },
        }),
        prisma.courseSection.findUnique({
          where: { id: input.sectionId },
          select: { id: true, courseId: true },
        }),
        prisma.studyGroupMember.findUnique({
          where: {
            groupId_userId: { groupId: input.groupId, userId },
          },
        }),
      ]);

      if (!group || group.sectionId !== null) {
        throw new ORPCError("BAD_REQUEST", { message: "custom_group_only" });
      }
      if (!section) {
        throw new ORPCError("NOT_FOUND", { message: "section_not_found" });
      }
      if (section.courseId !== group.courseId) {
        throw new ORPCError("BAD_REQUEST", { message: "course_mismatch" });
      }
      if (!inviterMembership) {
        throw new ORPCError("FORBIDDEN", { message: "not_group_member" });
      }

      const mySectionEn = await prisma.enrollment.findUnique({
        where: {
          userId_sectionId: { userId, sectionId: input.sectionId },
        },
      });
      if (!mySectionEn) {
        throw new ORPCError("FORBIDDEN", { message: "enrollment_required" });
      }

      const validEnrollments = await prisma.enrollment.findMany({
        where: {
          sectionId: input.sectionId,
          userId: { in: uniqueIds },
        },
        select: { userId: true },
      });
      const allowed = new Set(validEnrollments.map((e) => e.userId));

      const existingMembers = await prisma.studyGroupMember.findMany({
        where: { groupId: input.groupId, userId: { in: uniqueIds } },
        select: { userId: true },
      });
      const alreadyIn = new Set(existingMembers.map((m) => m.userId));

      let added = 0;
      let skippedNotInSection = 0;
      let skippedAlreadyMember = 0;
      let skippedFull = 0;
      let memberCount = group._count.members;

      for (const uid of uniqueIds) {
        if (!allowed.has(uid)) {
          skippedNotInSection++;
          continue;
        }
        if (alreadyIn.has(uid)) {
          skippedAlreadyMember++;
          continue;
        }
        if (memberCount >= group.maxMembers) {
          skippedFull++;
          continue;
        }
        try {
          await prisma.studyGroupMember.create({
            data: { groupId: input.groupId, userId: uid },
          });
          await logStudyGroupActivity(
            input.groupId,
            "member_joined",
            uid,
            userId,
          );
          added++;
          memberCount++;
          alreadyIn.add(uid);
        } catch {
          skippedAlreadyMember++;
        }
      }

      return {
        added,
        skippedNotInSection,
        skippedAlreadyMember,
        skippedFull,
      };
    });

  const studyGroupSharedFreeTime = authed
    .input(type({ groupId: "string" }))
    .handler(async ({ context, input }) => {
      try {
        return await computeGroupSharedFreeTime(context.userId, input.groupId);
      } catch (e) {
        if (e instanceof Error && e.message === "not_group_member") {
          throw new ORPCError("FORBIDDEN", { message: "not_a_member" });
        }
        const message = e instanceof Error ? e.message : "availability_failed";
        throw new ORPCError("BAD_REQUEST", { message });
      }
    });

  const studyGroupActivityLog = authed
    .input(type({ groupId: "string", "limit?": "number" }))
    .handler(async ({ context, input }) => {
      const member = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: context.userId,
          },
        },
      });
      if (!member) {
        throw new ORPCError("FORBIDDEN", { message: "not_a_member" });
      }
      const limit = Math.min(200, Math.max(1, input.limit ?? 120));
      const rows = await prisma.studyGroupActivity.findMany({
        where: { groupId: input.groupId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          subject: { select: { id: true, name: true } },
          actor: { select: { id: true, name: true } },
        },
      });
      return rows.reverse();
    });

  // ── messages ─────────────────────────────────────────────

  const messageList = authed
    .input(type({ groupId: "string", "cursor?": "string", "limit?": "number" }))
    .handler(async ({ input, context }) => {
      const member = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: context.userId,
          },
        },
      });
      if (!member) {
        throw new ORPCError("FORBIDDEN", { message: "not_a_member" });
      }

      const limit = input.limit ?? 50;

      return prisma.message.findMany({
        where: { groupId: input.groupId },
        include: { sender: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
        take: limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
    });

  const messageSend = authed
    .input(type({ groupId: "string", content: "string" }))
    .handler(async ({ context, input }) => {
      const member = await prisma.studyGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: input.groupId,
            userId: context.userId,
          },
        },
      });
      if (!member) {
        throw new ORPCError("FORBIDDEN", { message: "not_a_member" });
      }

      return prisma.message.create({
        data: {
          groupId: input.groupId,
          senderId: context.userId,
          content: input.content,
        },
        include: { sender: { select: { name: true, image: true } } },
      });
    });

  // ── direct messages (study-group peers only) ─────────────

  const directMessageList = authed
    .input(type({ peerUserId: "string" }))
    .handler(async ({ context, input }) => {
      if (input.peerUserId === context.userId) {
        throw new ORPCError("BAD_REQUEST", { message: "invalid_peer" });
      }
      try {
        await assertUsersShareStudyGroup(context.userId, input.peerUserId);
      } catch {
        throw new ORPCError("FORBIDDEN", { message: "not_a_peer" });
      }
      return prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: context.userId, recipientId: input.peerUserId },
            { senderId: input.peerUserId, recipientId: context.userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { sender: { select: { id: true, name: true, image: true } } },
      });
    });

  const directMessageSend = authed
    .input(type({ peerUserId: "string", content: "string" }))
    .handler(async ({ context, input }) => {
      const content = input.content.trim();
      if (!content) {
        throw new ORPCError("BAD_REQUEST", { message: "empty_message" });
      }
      if (input.peerUserId === context.userId) {
        throw new ORPCError("BAD_REQUEST", { message: "invalid_peer" });
      }
      try {
        await assertUsersShareStudyGroup(context.userId, input.peerUserId);
      } catch {
        throw new ORPCError("FORBIDDEN", { message: "not_a_peer" });
      }
      return prisma.directMessage.create({
        data: {
          senderId: context.userId,
          recipientId: input.peerUserId,
          content,
        },
        include: { sender: { select: { id: true, name: true, image: true } } },
      });
    });

  // ── settings ─────────────────────────────────────────────

  const calendarConnections = authed.handler(async ({ context }) => {
    return prisma.calendarConnection.findMany({
      where: { userId: context.userId },
    });
  });

  const syncGoogleCalendar = authed.handler(async ({ context }) => {
    try {
      return await syncUserDeadlinesToGoogleCalendar(context.userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "sync_failed";
      throw new ORPCError("BAD_REQUEST", { message });
    }
  });

  const disconnectCalendar = authed
    .input(type({ provider: "string" }))
    .handler(async ({ context, input }) => {
      const existing = await prisma.calendarConnection.findUnique({
        where: {
          userId_provider: {
            userId: context.userId,
            provider: input.provider,
          },
        },
      });

      if (input.provider === "google") {
        await deleteGoogleCalendarEventsForUser(context.userId);
      }

      if (existing?.refreshToken && isValidProvider(input.provider)) {
        try {
          const token = decryptToken(existing.refreshToken);
          await revokeToken(input.provider, token);
        } catch {
          // Best-effort revocation
        }
      }

      return prisma.calendarConnection.upsert({
        where: {
          userId_provider: {
            userId: context.userId,
            provider: input.provider,
          },
        },
        create: {
          userId: context.userId,
          provider: input.provider,
          connected: false,
        },
        update: {
          connected: false,
          email: null,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          providerAccountId: null,
          scope: null,
        },
      });
    });

  const reminderPreferences = authed.handler(async ({ context }) => {
    return prisma.reminderPreference.findMany({
      where: { userId: context.userId },
    });
  });

  const updateReminders = authed
    .input(
      type({ channel: "string", enabled: "boolean", offsetMinutes: "number" }),
    )
    .handler(async ({ context, input }) => {
      return prisma.reminderPreference.upsert({
        where: {
          userId_channel: {
            userId: context.userId,
            channel: input.channel,
          },
        },
        create: {
          userId: context.userId,
          channel: input.channel,
          enabled: input.enabled,
          offsetMinutes: input.offsetMinutes,
        },
        update: {
          enabled: input.enabled,
          offsetMinutes: input.offsetMinutes,
        },
      });
    });

  const updateProfile = authed
    .input(
      type({
        "name?": "string",
        "school?": "string",
        "program?": "string",
        "currentTerm?": "string",
      }),
    )
    .handler(async ({ context, input }) => {
      return prisma.user.update({
        where: { id: context.userId },
        data: input,
      });
    });

  // ── return router ────────────────────────────────────────

  return {
    uploads: {
      presign: presignedUpload,
      presignGet: presignedGet,
    },
    documents: {
      get: getDocument,
      start: startDocument,
      stream: streamDocument,
      confirm: confirmDocument,
      cancel: cancelDocument,
      cancelActive: cancelActiveDocuments,
    },
    users: {
      me,
      peerProfile: userPeerProfile,
    },
    schools: {
      list: schoolList,
    },
    courses: {
      list: courseList,
      get: courseGet,
    },
    sections: {
      list: sectionList,
      get: sectionGet,
      enrolled: sectionEnrolled,
      classmates: sectionClassmates,
    },
    deadlines: {
      list: deadlineList,
      upcoming: deadlineUpcoming,
      courseTermsEnded: deadlineCourseTermsEnded,
      inRange: deadlineInRange,
      toggleComplete: deadlineToggleComplete,
    },
    gradeWeights: {
      list: gradeWeightList,
    },
    enrollments: {
      enroll,
      unenroll,
    },
    studyGroups: {
      list: studyGroupList,
      get: studyGroupGet,
      create: studyGroupCreate,
      update: studyGroupUpdate,
      removeMember: studyGroupRemoveMember,
      delete: studyGroupDelete,
      join: studyGroupJoin,
      leave: studyGroupLeave,
      ensureClassChat: studyGroupEnsureClassChat,
      myClassChats: studyGroupMyClassChats,
      myCustomGroups: studyGroupMyCustomGroups,
      inviteFromSection: studyGroupInviteFromSection,
      sharedFreeTime: studyGroupSharedFreeTime,
      activityLog: studyGroupActivityLog,
    },
    messages: {
      list: messageList,
      send: messageSend,
    },
    directMessages: {
      list: directMessageList,
      send: directMessageSend,
    },
    settings: {
      calendarConnections,
      syncGoogleCalendar,
      disconnectCalendar,
      reminderPreferences,
      updateReminders,
      updateProfile,
    },
  };
}

export type Router = ReturnType<typeof createRouter>;
