import { randomUUID } from "node:crypto";
import { ORPCError, os } from "@orpc/server";
import { prisma } from "@repo/db";
import { createPresignedUpload, createPresignedGet } from "@repo/storage";
import { type } from "arktype";
import { start, getRun, resumeHook } from "workflow/api";
import {
	parseDocumentWorkflow,
	type ProgressEvent,
} from "../workflows/parse-document";
import {
	syllabusExtractionSchema,
} from "../workflows/parse-document/extraction-schema";

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

	// ── users ────────────────────────────────────────────────

	const me = authed.handler(async ({ context }) => {
		return prisma.user.findUniqueOrThrow({
			where: { id: context.userId },
			include: { calendarConnections: true, reminderPreferences: true },
		});
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
					_count: { select: { sections: true, studyGroups: true } },
					sections: {
						select: {
							_count: { select: { enrollments: true, documents: true } },
						},
					},
				},
			});

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
				return { ...rest, totalEnrollments, totalDocuments };
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

	const deadlineToggleComplete = authed
		.input(type({ deadlineId: "string", completed: "boolean" }))
		.handler(async ({ context, input }) => {
			const deadline = await prisma.deadline.findUniqueOrThrow({
				where: { id: input.deadlineId },
				include: { section: { include: { enrollments: { where: { userId: context.userId } } } } },
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
			return prisma.enrollment.delete({
				where: {
					userId_sectionId: {
						userId: context.userId,
						sectionId: input.sectionId,
					},
				},
			});
		});

	// ── studyGroups ──────────────────────────────────────────

	const studyGroupList = base
		.input(type({ courseId: "string" }))
		.handler(async ({ input }) => {
			return prisma.studyGroup.findMany({
				where: { courseId: input.courseId },
				include: {
					_count: { select: { members: true } },
					members: {
						include: { user: { select: { name: true, image: true } } },
					},
				},
			});
		});

	const studyGroupCreate = authed
		.input(type({ courseId: "string", name: "string", "maxMembers?": "number" }))
		.handler(async ({ context, input }) => {
			return prisma.studyGroup.create({
				data: {
					courseId: input.courseId,
					name: input.name,
					maxMembers: input.maxMembers ?? 6,
					members: {
						create: { userId: context.userId },
					},
				},
				include: { members: true },
			});
		});

	const studyGroupJoin = authed
		.input(type({ groupId: "string" }))
		.handler(async ({ context, input }) => {
			return prisma.studyGroupMember.create({
				data: { groupId: input.groupId, userId: context.userId },
			});
		});

	const studyGroupLeave = authed
		.input(type({ groupId: "string" }))
		.handler(async ({ context, input }) => {
			return prisma.studyGroupMember.delete({
				where: {
					groupId_userId: {
						groupId: input.groupId,
						userId: context.userId,
					},
				},
			});
		});

	// ── messages ─────────────────────────────────────────────

	const messageList = authed
		.input(type({ groupId: "string", "cursor?": "string", "limit?": "number" }))
		.handler(async ({ input }) => {
			const limit = input.limit ?? 50;

			return prisma.message.findMany({
				where: { groupId: input.groupId },
				include: { sender: { select: { name: true, image: true } } },
				orderBy: { createdAt: "asc" },
				take: limit,
				...(input.cursor
					? { cursor: { id: input.cursor }, skip: 1 }
					: {}),
			});
		});

	const messageSend = authed
		.input(type({ groupId: "string", content: "string" }))
		.handler(async ({ context, input }) => {
			return prisma.message.create({
				data: {
					groupId: input.groupId,
					senderId: context.userId,
					content: input.content,
				},
				include: { sender: { select: { name: true, image: true } } },
			});
		});

	// ── settings ─────────────────────────────────────────────

	const calendarConnections = authed.handler(async ({ context }) => {
		return prisma.calendarConnection.findMany({
			where: { userId: context.userId },
		});
	});

	const toggleCalendar = authed
		.input(type({ provider: "string", connected: "boolean", "email?": "string" }))
		.handler(async ({ context, input }) => {
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
					connected: input.connected,
					email: input.email,
				},
				update: {
					connected: input.connected,
					email: input.email,
				},
			});
		});

	const reminderPreferences = authed.handler(async ({ context }) => {
		return prisma.reminderPreference.findMany({
			where: { userId: context.userId },
		});
	});

	const updateReminders = authed
		.input(type({ channel: "string", enabled: "boolean", offsetMinutes: "number" }))
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
		.input(type({ "name?": "string", "school?": "string", "program?": "string", "currentTerm?": "string" }))
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
		},
		users: {
			me,
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
		},
		deadlines: {
			list: deadlineList,
			upcoming: deadlineUpcoming,
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
			create: studyGroupCreate,
			join: studyGroupJoin,
			leave: studyGroupLeave,
		},
		messages: {
			list: messageList,
			send: messageSend,
		},
		settings: {
			calendarConnections,
			toggleCalendar,
			reminderPreferences,
			updateReminders,
			updateProfile,
		},
	};
}

export type Router = ReturnType<typeof createRouter>;
