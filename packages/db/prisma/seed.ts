import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("Seeding database...");

	// Clear existing seed data (order matters for FK constraints)
	await prisma.message.deleteMany();
	await prisma.studyGroupMember.deleteMany();
	await prisma.studyGroup.deleteMany();
	await prisma.calendarConnection.deleteMany();
	await prisma.reminderPreference.deleteMany();
	await prisma.document.deleteMany();
	await prisma.deadline.deleteMany();
	await prisma.gradeWeight.deleteMany();
	await prisma.enrollment.deleteMany();
	await prisma.courseSection.deleteMany();
	await prisma.course.deleteMany();
	await prisma.school.deleteMany();

	// ── Schools ──
	const uw = await prisma.school.create({
		data: { name: "University of Waterloo", shortName: "UW" },
	});
	const wlu = await prisma.school.create({
		data: { name: "Wilfrid Laurier University", shortName: "WLU" },
	});
	const uoft = await prisma.school.create({
		data: { name: "University of Toronto", shortName: "UofT" },
	});

	// ── Users (Better Auth manages IDs, so we upsert by email) ──
	const userSeedData = [
		{ name: "Apostolos Geyer", email: "ajgeyer@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
		{ name: "Priya Sharma", email: "psharma@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
		{ name: "Kevin Liu", email: "kliu@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
		{ name: "Rachel Park", email: "rpark@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
		{ name: "Daniel Fernandez", email: "dfernandez@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
		{ name: "Emily Zhang", email: "ezhang@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
		{ name: "Nadia Hussein", email: "nhussein@uwaterloo.ca", school: "University of Waterloo", program: "Computer Science", currentTerm: "Winter 2026" },
	];

	const users: Awaited<ReturnType<typeof prisma.user.upsert>>[] = [];
	for (const u of userSeedData) {
		const user = await prisma.user.upsert({
			where: { email: u.email },
			update: { name: u.name, school: u.school, program: u.program, currentTerm: u.currentTerm },
			create: { id: crypto.randomUUID(), ...u, emailVerified: false, updatedAt: new Date() },
		});
		users.push(user);
	}
	const [apostolos, priya, kevin, rachel, daniel, emily, nadia] = users;

	// ── Courses ──
	const cs348 = await prisma.course.create({ data: { schoolId: uw.id, code: "CS 348", name: "Intro to Databases" } });
	const cs350 = await prisma.course.create({ data: { schoolId: uw.id, code: "CS 350", name: "Operating Systems" } });
	const math239 = await prisma.course.create({ data: { schoolId: uw.id, code: "MATH 239", name: "Intro to Combinatorics" } });
	const cs370 = await prisma.course.create({ data: { schoolId: uw.id, code: "CS 370", name: "Numerical Computation" } });
	const stat230 = await prisma.course.create({ data: { schoolId: uw.id, code: "STAT 230", name: "Probability" } });
	await prisma.course.create({ data: { schoolId: wlu.id, code: "BU 283", name: "Corporate Finance" } });
	await prisma.course.create({ data: { schoolId: wlu.id, code: "EC 120", name: "Intro to Microeconomics" } });
	await prisma.course.create({ data: { schoolId: uoft.id, code: "CSC 263", name: "Data Structures & Analysis" } });
	await prisma.course.create({ data: { schoolId: uoft.id, code: "MAT 237", name: "Multivariable Calculus" } });

	// ── Course Sections ──
	const cs348_w26_001 = await prisma.courseSection.create({ data: { courseId: cs348.id, term: "Winter 2026", section: "001", instructor: "Grant Cheston", theme: "blue" } });
	await prisma.courseSection.create({ data: { courseId: cs348.id, term: "Winter 2026", section: "002", instructor: "Ihab Ilyas", theme: "blue" } });
	const cs350_w26_001 = await prisma.courseSection.create({ data: { courseId: cs350.id, term: "Winter 2026", section: "001", instructor: "Lesley Istead", theme: "green" } });
	const math239_w26_001 = await prisma.courseSection.create({ data: { courseId: math239.id, term: "Winter 2026", section: "001", instructor: "Martin Pei", theme: "orange" } });
	await prisma.courseSection.create({ data: { courseId: math239.id, term: "Winter 2026", section: "002", instructor: "David Wagner", theme: "orange" } });
	const cs370_w26_001 = await prisma.courseSection.create({ data: { courseId: cs370.id, term: "Winter 2026", section: "001", instructor: "Jeff Orchard", theme: "pink" } });
	const stat230_w26_001 = await prisma.courseSection.create({ data: { courseId: stat230.id, term: "Winter 2026", section: "001", instructor: "Dina Dawoud", theme: "purple" } });
	await prisma.courseSection.create({ data: { courseId: stat230.id, term: "Winter 2026", section: "002", instructor: "Michael Wallace", theme: "purple" } });
	await prisma.courseSection.create({ data: { courseId: cs348.id, term: "Fall 2025", section: "001", instructor: "Tamer Özsu", theme: "blue" } });
	await prisma.courseSection.create({ data: { courseId: cs350.id, term: "Fall 2025", section: "001", instructor: "Kevin Lanctot", theme: "green" } });

	// ── Enrollments (user-1 enrolled in 5 sections) ──
	const enrolledSections = [cs348_w26_001, cs350_w26_001, math239_w26_001, cs370_w26_001, stat230_w26_001];
	for (const sec of enrolledSections) {
		await prisma.enrollment.create({
			data: { userId: apostolos.id, sectionId: sec.id, enrolledAt: new Date("2026-01-06T09:00:00Z") },
		});
	}

	// ── Deadlines ──
	const dlData = [
		// CS 348
		{ sectionId: cs348_w26_001.id, title: "Assignment 1 – ER Diagrams", dueDate: new Date("2026-03-03T23:59:00Z"), type: "assignment", weight: 5, completed: true },
		{ sectionId: cs348_w26_001.id, title: "Assignment 2 – SQL Queries", dueDate: new Date("2026-03-14T23:59:00Z"), type: "assignment", weight: 5, completed: false },
		{ sectionId: cs348_w26_001.id, title: "Midterm Exam", dueDate: new Date("2026-03-20T19:00:00Z"), type: "exam", weight: 25, completed: false },
		{ sectionId: cs348_w26_001.id, title: "Project Milestone 1", dueDate: new Date("2026-03-08T23:59:00Z"), type: "project", weight: 10, completed: true },
		{ sectionId: cs348_w26_001.id, title: "Project Final Submission", dueDate: new Date("2026-04-10T23:59:00Z"), type: "project", weight: 10, completed: false },
		// CS 350
		{ sectionId: cs350_w26_001.id, title: "Assignment 1 – Threads & Synchronization", dueDate: new Date("2026-03-05T23:59:00Z"), type: "assignment", weight: 5, completed: true },
		{ sectionId: cs350_w26_001.id, title: "Lab 1 – System Calls", dueDate: new Date("2026-03-13T23:59:00Z"), type: "lab", weight: 5, completed: false },
		{ sectionId: cs350_w26_001.id, title: "Quiz 1 – Processes & Scheduling", dueDate: new Date("2026-03-15T14:30:00Z"), type: "quiz", weight: 5, completed: false },
		{ sectionId: cs350_w26_001.id, title: "Midterm Exam", dueDate: new Date("2026-03-27T19:00:00Z"), type: "exam", weight: 25, completed: false },
		{ sectionId: cs350_w26_001.id, title: "Assignment 2 – Virtual Memory", dueDate: new Date("2026-04-03T23:59:00Z"), type: "assignment", weight: 5, completed: false },
		// MATH 239
		{ sectionId: math239_w26_001.id, title: "Assignment 3 – Generating Functions", dueDate: new Date("2026-03-07T23:59:00Z"), type: "assignment", weight: 5, completed: true },
		{ sectionId: math239_w26_001.id, title: "Midterm Exam", dueDate: new Date("2026-03-25T19:00:00Z"), type: "exam", weight: 30, completed: false },
		{ sectionId: math239_w26_001.id, title: "Assignment 4 – Graph Theory", dueDate: new Date("2026-04-04T23:59:00Z"), type: "assignment", weight: 5, completed: false },
		// CS 370
		{ sectionId: cs370_w26_001.id, title: "Assignment 2 – Interpolation", dueDate: new Date("2026-03-06T23:59:00Z"), type: "assignment", weight: 5, completed: true },
		{ sectionId: cs370_w26_001.id, title: "Assignment 3 – Numerical Integration", dueDate: new Date("2026-03-18T23:59:00Z"), type: "assignment", weight: 5, completed: false },
		{ sectionId: cs370_w26_001.id, title: "Project Proposal", dueDate: new Date("2026-03-12T23:59:00Z"), type: "project", weight: 5, completed: false },
		{ sectionId: cs370_w26_001.id, title: "Midterm Exam", dueDate: new Date("2026-04-01T19:00:00Z"), type: "exam", weight: 20, completed: false },
		// STAT 230
		{ sectionId: stat230_w26_001.id, title: "Quiz 2 – Conditional Probability", dueDate: new Date("2026-03-04T10:30:00Z"), type: "quiz", weight: 2, completed: true },
		{ sectionId: stat230_w26_001.id, title: "Assignment 3 – Discrete Distributions", dueDate: new Date("2026-03-14T23:59:00Z"), type: "assignment", weight: 5, completed: false },
		{ sectionId: stat230_w26_001.id, title: "Midterm Exam", dueDate: new Date("2026-04-08T19:00:00Z"), type: "exam", weight: 25, completed: false },
	];
	for (const d of dlData) {
		await prisma.deadline.create({ data: d });
	}

	// ── Grade Weights ──
	const gwData = [
		// CS 348 (20 + 25 + 20 + 35 = 100)
		{ sectionId: cs348_w26_001.id, label: "Assignments", type: "assignment", weight: 20 },
		{ sectionId: cs348_w26_001.id, label: "Midterm", type: "exam", weight: 25 },
		{ sectionId: cs348_w26_001.id, label: "Project", type: "project", weight: 20 },
		{ sectionId: cs348_w26_001.id, label: "Final Exam", type: "exam", weight: 35 },
		// CS 350 (15 + 10 + 25 + 40 + 10 = 100)
		{ sectionId: cs350_w26_001.id, label: "Assignments", type: "assignment", weight: 15 },
		{ sectionId: cs350_w26_001.id, label: "Labs", type: "lab", weight: 10 },
		{ sectionId: cs350_w26_001.id, label: "Midterm", type: "exam", weight: 25 },
		{ sectionId: cs350_w26_001.id, label: "Final Exam", type: "exam", weight: 40 },
		{ sectionId: cs350_w26_001.id, label: "Quizzes", type: "quiz", weight: 10 },
		// MATH 239 (20 + 30 + 50 = 100)
		{ sectionId: math239_w26_001.id, label: "Assignments", type: "assignment", weight: 20 },
		{ sectionId: math239_w26_001.id, label: "Midterm", type: "exam", weight: 30 },
		{ sectionId: math239_w26_001.id, label: "Final Exam", type: "exam", weight: 50 },
		// CS 370 (25 + 25 + 20 + 30 = 100)
		{ sectionId: cs370_w26_001.id, label: "Assignments", type: "assignment", weight: 25 },
		{ sectionId: cs370_w26_001.id, label: "Project", type: "project", weight: 25 },
		{ sectionId: cs370_w26_001.id, label: "Midterm", type: "exam", weight: 20 },
		{ sectionId: cs370_w26_001.id, label: "Final Exam", type: "exam", weight: 30 },
		// STAT 230 (15 + 10 + 25 + 50 = 100)
		{ sectionId: stat230_w26_001.id, label: "Assignments", type: "assignment", weight: 15 },
		{ sectionId: stat230_w26_001.id, label: "Quizzes", type: "quiz", weight: 10 },
		{ sectionId: stat230_w26_001.id, label: "Midterm", type: "exam", weight: 25 },
		{ sectionId: stat230_w26_001.id, label: "Final Exam", type: "exam", weight: 50 },
	];
	for (const gw of gwData) {
		await prisma.gradeWeight.create({ data: gw });
	}

	// ── Documents ──
	const docData = [
		{ sectionId: cs348_w26_001.id, filename: "cs348-w26-syllabus.pdf", s3Key: "uploads/cs348-w26-syllabus.pdf", contentHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", uploadedById: apostolos.id, status: "completed", uploadedAt: new Date("2026-01-08T14:30:00Z"), parsedDeadlineCount: 5 },
		{ sectionId: cs348_w26_001.id, filename: "lecture-06-sql-joins.pdf", s3Key: "uploads/lecture-06-sql-joins.pdf", contentHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", uploadedById: priya.id, status: "completed", uploadedAt: new Date("2026-03-04T09:15:00Z"), parsedDeadlineCount: 0 },
		{ sectionId: cs350_w26_001.id, filename: "cs350-w26-outline.pdf", s3Key: "uploads/cs350-w26-outline.pdf", contentHash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4", uploadedById: daniel.id, status: "completed", uploadedAt: new Date("2026-01-10T16:00:00Z"), parsedDeadlineCount: 5 },
		{ sectionId: math239_w26_001.id, filename: "math239-w26-syllabus.pdf", s3Key: "uploads/math239-w26-syllabus.pdf", contentHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5", uploadedById: nadia.id, status: "processing", uploadedAt: new Date("2026-03-11T22:45:00Z"), parsedDeadlineCount: 0 },
		{ sectionId: cs370_w26_001.id, filename: "cs370-w26-outline.pdf", s3Key: "uploads/cs370-w26-outline.pdf", contentHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6", uploadedById: apostolos.id, status: "pending", uploadedAt: new Date("2026-03-12T08:00:00Z"), parsedDeadlineCount: 0 },
	];
	for (const d of docData) {
		await prisma.document.create({ data: d });
	}

	// ── Study Groups ──
	const dbStudyCrew = await prisma.studyGroup.create({ data: { name: "DB Study Crew", courseId: cs348.id, maxMembers: 6 } });
	const osGrinders = await prisma.studyGroup.create({ data: { name: "OS Grinders", courseId: cs350.id, maxMembers: 5 } });
	const comboProofs = await prisma.studyGroup.create({ data: { name: "Combo Proofs", courseId: math239.id, maxMembers: 4 } });

	// ── Study Group Members ──
	const memberData = [
		{ groupId: dbStudyCrew.id, userId: apostolos.id },
		{ groupId: dbStudyCrew.id, userId: priya.id },
		{ groupId: dbStudyCrew.id, userId: kevin.id },
		{ groupId: dbStudyCrew.id, userId: rachel.id },
		{ groupId: osGrinders.id, userId: apostolos.id },
		{ groupId: osGrinders.id, userId: daniel.id },
		{ groupId: osGrinders.id, userId: emily.id },
		{ groupId: comboProofs.id, userId: apostolos.id },
		{ groupId: comboProofs.id, userId: nadia.id },
	];
	for (const m of memberData) {
		await prisma.studyGroupMember.create({ data: m });
	}

	// ── Messages (DB Study Crew) ──
	const msgData = [
		{ groupId: dbStudyCrew.id, senderId: priya.id, content: "Has anyone started A2 yet? The SQL joins question looks tricky.", createdAt: new Date("2026-03-10T18:30:00Z") },
		{ groupId: dbStudyCrew.id, senderId: kevin.id, content: "Yeah I got stuck on Q3 with the nested subqueries. Want to meet up tomorrow?", createdAt: new Date("2026-03-10T18:45:00Z") },
		{ groupId: dbStudyCrew.id, senderId: apostolos.id, content: "I'm down. DC library around 2pm?", createdAt: new Date("2026-03-10T19:02:00Z") },
		{ groupId: dbStudyCrew.id, senderId: rachel.id, content: "I can make it at 2:30, save me a seat!", createdAt: new Date("2026-03-10T19:15:00Z") },
		{ groupId: dbStudyCrew.id, senderId: priya.id, content: "Perfect. I'll book a group study room on LibCal.", createdAt: new Date("2026-03-10T19:20:00Z") },
		{ groupId: dbStudyCrew.id, senderId: kevin.id, content: "Does anyone have notes on relational algebra from last lecture? I missed it.", createdAt: new Date("2026-03-11T10:00:00Z") },
		{ groupId: dbStudyCrew.id, senderId: apostolos.id, content: "I uploaded the PDF to DueDeck, check the documents tab.", createdAt: new Date("2026-03-11T10:15:00Z") },
		{ groupId: dbStudyCrew.id, senderId: kevin.id, content: "Legend, thanks!", createdAt: new Date("2026-03-11T10:18:00Z") },
		{ groupId: dbStudyCrew.id, senderId: rachel.id, content: "Reminder: midterm is March 20. We should do a review session the weekend before.", createdAt: new Date("2026-03-11T14:30:00Z") },
		{ groupId: dbStudyCrew.id, senderId: priya.id, content: "Good idea. Saturday afternoon works for me. Let's finalize after A2 is done.", createdAt: new Date("2026-03-11T14:45:00Z") },
	];
	for (const m of msgData) {
		await prisma.message.create({ data: m });
	}

	// ── Calendar Connections ──
	await prisma.calendarConnection.create({ data: { userId: apostolos.id, provider: "google", connected: false } });
	await prisma.calendarConnection.create({ data: { userId: apostolos.id, provider: "microsoft", connected: false } });

	// ── Reminder Preferences ──
	await prisma.reminderPreference.create({ data: { userId: apostolos.id, channel: "push", enabled: true, offsetMinutes: 1440 } });
	await prisma.reminderPreference.create({ data: { userId: apostolos.id, channel: "email", enabled: true, offsetMinutes: 4320 } });

	console.log("Seeding complete.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
