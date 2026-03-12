// ──────────────────────────────────────────────
// DueDeck – Mock Data
// Generated for dev/prototyping. Today = 2026-03-12
// ──────────────────────────────────────────────

/* ─── Type Definitions ─── */

export interface Subscription {
  plan: "free" | "pro";
  status: "active" | "cancelled" | "past_due";
  renewsAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  school: string;
  program: string;
  currentTerm: string;
  avatarUrl: string | null;
  subscription: Subscription;
}

export type CourseTheme = "blue" | "green" | "orange" | "pink" | "purple";

/** School-level permanent entity. Not owned by any user. */
export interface Course {
  id: string;
  schoolId: string;
  code: string;
  name: string;
}

/** Term + section specific offering of a Course. */
export interface CourseSection {
  id: string;
  courseId: string;
  term: string;
  section: string;
  instructor: string;
  theme: CourseTheme;
}

export interface Deadline {
  id: string;
  sectionId: string;
  courseCode: string;
  title: string;
  dueDate: string;
  type: "assignment" | "exam" | "quiz" | "project" | "lab";
  weight: number;
  completed: boolean;
}

export interface Document {
  id: string;
  sectionId: string;
  filename: string;
  contentHash: string;
  uploadedById: string;
  status: "pending" | "processing" | "completed" | "failed";
  uploadedAt: string;
  parsedDeadlineCount: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  courseId: string;
  courseCode: string;
  schoolId: string;
  members: GroupMember[];
  maxMembers: number;
}

export interface GroupMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  online: boolean;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface CalendarConnection {
  provider: "google" | "microsoft" | "apple";
  connected: boolean;
  email: string | null;
}

export interface ReminderPreference {
  channel: "push" | "email";
  enabled: boolean;
  offsetMinutes: number;
}

export interface GradeWeight {
  sectionId: string;
  label: string;
  type: "assignment" | "exam" | "quiz" | "project" | "lab" | "participation";
  weight: number;
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  studentCount: number;
  courseCount: number;
}

export interface Enrollment {
  userId: string;
  sectionId: string;
  enrolledAt: string;
}

/** Aggregate view of a Course for the browse/discovery UI. */
export interface BrowseCourse {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  studentCount: number;
  groupCount: number;
  documentCount: number;
  sectionCount: number;
}

/** A section shown in the browse UI when user picks a course. */
export interface BrowseSection {
  id: string;
  courseId: string;
  term: string;
  section: string;
  instructor: string;
  studentCount: number;
  documentCount: number;
}

/* ─── Mock User ─── */

export const MOCK_USER: User = {
  id: "user-1",
  name: "Apostolos Geyer",
  email: "ajgeyer@uwaterloo.ca",
  school: "University of Waterloo",
  program: "Computer Science",
  currentTerm: "Winter 2026",
  avatarUrl: null,
  subscription: {
    plan: "free",
    status: "active",
    renewsAt: null,
  },
};

/* ─── Courses (permanent, school-level) ─── */

export const MOCK_COURSES: Course[] = [
  { id: "course-cs348", schoolId: "school-uw", code: "CS 348", name: "Intro to Databases" },
  { id: "course-cs350", schoolId: "school-uw", code: "CS 350", name: "Operating Systems" },
  { id: "course-math239", schoolId: "school-uw", code: "MATH 239", name: "Intro to Combinatorics" },
  { id: "course-cs370", schoolId: "school-uw", code: "CS 370", name: "Numerical Computation" },
  { id: "course-stat230", schoolId: "school-uw", code: "STAT 230", name: "Probability" },
  { id: "course-bu283", schoolId: "school-wlu", code: "BU 283", name: "Corporate Finance" },
  { id: "course-ec120", schoolId: "school-wlu", code: "EC 120", name: "Intro to Microeconomics" },
  { id: "course-csc263", schoolId: "school-uoft", code: "CSC 263", name: "Data Structures & Analysis" },
  { id: "course-mat237", schoolId: "school-uoft", code: "MAT 237", name: "Multivariable Calculus" },
];

/* ─── Course Sections (term-specific offerings) ─── */

export const MOCK_SECTIONS: CourseSection[] = [
  // ── Winter 2026 (current) ──
  { id: "sec-cs348-w26-001", courseId: "course-cs348", term: "Winter 2026", section: "001", instructor: "Grant Cheston", theme: "blue" },
  { id: "sec-cs348-w26-002", courseId: "course-cs348", term: "Winter 2026", section: "002", instructor: "Ihab Ilyas", theme: "blue" },
  { id: "sec-cs350-w26-001", courseId: "course-cs350", term: "Winter 2026", section: "001", instructor: "Lesley Istead", theme: "green" },
  { id: "sec-math239-w26-001", courseId: "course-math239", term: "Winter 2026", section: "001", instructor: "Martin Pei", theme: "orange" },
  { id: "sec-math239-w26-002", courseId: "course-math239", term: "Winter 2026", section: "002", instructor: "David Wagner", theme: "orange" },
  { id: "sec-cs370-w26-001", courseId: "course-cs370", term: "Winter 2026", section: "001", instructor: "Jeff Orchard", theme: "pink" },
  { id: "sec-stat230-w26-001", courseId: "course-stat230", term: "Winter 2026", section: "001", instructor: "Dina Dawoud", theme: "purple" },
  { id: "sec-stat230-w26-002", courseId: "course-stat230", term: "Winter 2026", section: "002", instructor: "Michael Wallace", theme: "purple" },

  // ── Fall 2025 (past) ──
  { id: "sec-cs348-f25-001", courseId: "course-cs348", term: "Fall 2025", section: "001", instructor: "Tamer Özsu", theme: "blue" },
  { id: "sec-cs350-f25-001", courseId: "course-cs350", term: "Fall 2025", section: "001", instructor: "Kevin Lanctot", theme: "green" },
];

/* ─── Deadlines (belong to sections) ─── */

export const MOCK_DEADLINES: Deadline[] = [
  // ── CS 348 sec 001 ──
  { id: "dl-1", sectionId: "sec-cs348-w26-001", courseCode: "CS 348", title: "Assignment 1 – ER Diagrams", dueDate: "2026-03-03T23:59:00Z", type: "assignment", weight: 5, completed: true },
  { id: "dl-2", sectionId: "sec-cs348-w26-001", courseCode: "CS 348", title: "Assignment 2 – SQL Queries", dueDate: "2026-03-14T23:59:00Z", type: "assignment", weight: 5, completed: false },
  { id: "dl-3", sectionId: "sec-cs348-w26-001", courseCode: "CS 348", title: "Midterm Exam", dueDate: "2026-03-20T19:00:00Z", type: "exam", weight: 25, completed: false },
  { id: "dl-4", sectionId: "sec-cs348-w26-001", courseCode: "CS 348", title: "Project Milestone 1", dueDate: "2026-03-08T23:59:00Z", type: "project", weight: 10, completed: true },
  { id: "dl-5", sectionId: "sec-cs348-w26-001", courseCode: "CS 348", title: "Project Final Submission", dueDate: "2026-04-10T23:59:00Z", type: "project", weight: 10, completed: false },

  // ── CS 350 sec 001 ──
  { id: "dl-6", sectionId: "sec-cs350-w26-001", courseCode: "CS 350", title: "Assignment 1 – Threads & Synchronization", dueDate: "2026-03-05T23:59:00Z", type: "assignment", weight: 5, completed: true },
  { id: "dl-7", sectionId: "sec-cs350-w26-001", courseCode: "CS 350", title: "Lab 1 – System Calls", dueDate: "2026-03-13T23:59:00Z", type: "lab", weight: 5, completed: false },
  { id: "dl-8", sectionId: "sec-cs350-w26-001", courseCode: "CS 350", title: "Quiz 1 – Processes & Scheduling", dueDate: "2026-03-15T14:30:00Z", type: "quiz", weight: 5, completed: false },
  { id: "dl-9", sectionId: "sec-cs350-w26-001", courseCode: "CS 350", title: "Midterm Exam", dueDate: "2026-03-27T19:00:00Z", type: "exam", weight: 25, completed: false },
  { id: "dl-10", sectionId: "sec-cs350-w26-001", courseCode: "CS 350", title: "Assignment 2 – Virtual Memory", dueDate: "2026-04-03T23:59:00Z", type: "assignment", weight: 5, completed: false },

  // ── MATH 239 sec 001 ──
  { id: "dl-11", sectionId: "sec-math239-w26-001", courseCode: "MATH 239", title: "Assignment 3 – Generating Functions", dueDate: "2026-03-07T23:59:00Z", type: "assignment", weight: 5, completed: true },
  { id: "dl-12", sectionId: "sec-math239-w26-001", courseCode: "MATH 239", title: "Midterm Exam", dueDate: "2026-03-25T19:00:00Z", type: "exam", weight: 30, completed: false },
  { id: "dl-13", sectionId: "sec-math239-w26-001", courseCode: "MATH 239", title: "Assignment 4 – Graph Theory", dueDate: "2026-04-04T23:59:00Z", type: "assignment", weight: 5, completed: false },

  // ── CS 370 sec 001 ──
  { id: "dl-14", sectionId: "sec-cs370-w26-001", courseCode: "CS 370", title: "Assignment 2 – Interpolation", dueDate: "2026-03-06T23:59:00Z", type: "assignment", weight: 5, completed: true },
  { id: "dl-15", sectionId: "sec-cs370-w26-001", courseCode: "CS 370", title: "Assignment 3 – Numerical Integration", dueDate: "2026-03-18T23:59:00Z", type: "assignment", weight: 5, completed: false },
  { id: "dl-16", sectionId: "sec-cs370-w26-001", courseCode: "CS 370", title: "Project Proposal", dueDate: "2026-03-12T23:59:00Z", type: "project", weight: 5, completed: false },
  { id: "dl-17", sectionId: "sec-cs370-w26-001", courseCode: "CS 370", title: "Midterm Exam", dueDate: "2026-04-01T19:00:00Z", type: "exam", weight: 20, completed: false },

  // ── STAT 230 sec 001 ──
  { id: "dl-18", sectionId: "sec-stat230-w26-001", courseCode: "STAT 230", title: "Quiz 2 – Conditional Probability", dueDate: "2026-03-04T10:30:00Z", type: "quiz", weight: 2, completed: true },
  { id: "dl-19", sectionId: "sec-stat230-w26-001", courseCode: "STAT 230", title: "Assignment 3 – Discrete Distributions", dueDate: "2026-03-14T23:59:00Z", type: "assignment", weight: 5, completed: false },
  { id: "dl-20", sectionId: "sec-stat230-w26-001", courseCode: "STAT 230", title: "Midterm Exam", dueDate: "2026-04-08T19:00:00Z", type: "exam", weight: 25, completed: false },
];

/* ─── Grade Weights (belong to sections) ─── */

export const MOCK_GRADE_WEIGHTS: GradeWeight[] = [
  // CS 348 sec 001 – 20 + 25 + 20 + 35 = 100
  { sectionId: "sec-cs348-w26-001", label: "Assignments", type: "assignment", weight: 20 },
  { sectionId: "sec-cs348-w26-001", label: "Midterm", type: "exam", weight: 25 },
  { sectionId: "sec-cs348-w26-001", label: "Project", type: "project", weight: 20 },
  { sectionId: "sec-cs348-w26-001", label: "Final Exam", type: "exam", weight: 35 },

  // CS 350 sec 001 – 15 + 10 + 25 + 40 + 10 = 100
  { sectionId: "sec-cs350-w26-001", label: "Assignments", type: "assignment", weight: 15 },
  { sectionId: "sec-cs350-w26-001", label: "Labs", type: "lab", weight: 10 },
  { sectionId: "sec-cs350-w26-001", label: "Midterm", type: "exam", weight: 25 },
  { sectionId: "sec-cs350-w26-001", label: "Final Exam", type: "exam", weight: 40 },
  { sectionId: "sec-cs350-w26-001", label: "Quizzes", type: "quiz", weight: 10 },

  // MATH 239 sec 001 – 20 + 30 + 50 = 100
  { sectionId: "sec-math239-w26-001", label: "Assignments", type: "assignment", weight: 20 },
  { sectionId: "sec-math239-w26-001", label: "Midterm", type: "exam", weight: 30 },
  { sectionId: "sec-math239-w26-001", label: "Final Exam", type: "exam", weight: 50 },

  // CS 370 sec 001 – 25 + 25 + 20 + 30 = 100
  { sectionId: "sec-cs370-w26-001", label: "Assignments", type: "assignment", weight: 25 },
  { sectionId: "sec-cs370-w26-001", label: "Project", type: "project", weight: 25 },
  { sectionId: "sec-cs370-w26-001", label: "Midterm", type: "exam", weight: 20 },
  { sectionId: "sec-cs370-w26-001", label: "Final Exam", type: "exam", weight: 30 },

  // STAT 230 sec 001 – 15 + 10 + 25 + 50 = 100
  { sectionId: "sec-stat230-w26-001", label: "Assignments", type: "assignment", weight: 15 },
  { sectionId: "sec-stat230-w26-001", label: "Quizzes", type: "quiz", weight: 10 },
  { sectionId: "sec-stat230-w26-001", label: "Midterm", type: "exam", weight: 25 },
  { sectionId: "sec-stat230-w26-001", label: "Final Exam", type: "exam", weight: 50 },
];

/* ─── Documents (belong to sections) ─── */

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc-1",
    sectionId: "sec-cs348-w26-001",
    filename: "cs348-w26-syllabus.pdf",
    contentHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    uploadedById: "user-1",
    status: "completed",
    uploadedAt: "2026-01-08T14:30:00Z",
    parsedDeadlineCount: 5,
  },
  {
    id: "doc-2",
    sectionId: "sec-cs348-w26-001",
    filename: "lecture-06-sql-joins.pdf",
    contentHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    uploadedById: "user-2",
    status: "completed",
    uploadedAt: "2026-03-04T09:15:00Z",
    parsedDeadlineCount: 0,
  },
  {
    id: "doc-3",
    sectionId: "sec-cs350-w26-001",
    filename: "cs350-w26-outline.pdf",
    contentHash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    uploadedById: "user-5",
    status: "completed",
    uploadedAt: "2026-01-10T16:00:00Z",
    parsedDeadlineCount: 5,
  },
  {
    id: "doc-4",
    sectionId: "sec-math239-w26-001",
    filename: "math239-w26-syllabus.pdf",
    contentHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    uploadedById: "user-7",
    status: "processing",
    uploadedAt: "2026-03-11T22:45:00Z",
    parsedDeadlineCount: 0,
  },
  {
    id: "doc-5",
    sectionId: "sec-cs370-w26-001",
    filename: "cs370-w26-outline.pdf",
    contentHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    uploadedById: "user-1",
    status: "pending",
    uploadedAt: "2026-03-12T08:00:00Z",
    parsedDeadlineCount: 0,
  },
];

/* ─── Study Groups (at course level, cross-section) ─── */

const dbStudyCrewMembers: GroupMember[] = [
  { id: "user-1", name: "Apostolos Geyer", avatarUrl: null, online: true },
  { id: "user-2", name: "Priya Sharma", avatarUrl: null, online: true },
  { id: "user-3", name: "Kevin Liu", avatarUrl: null, online: false },
  { id: "user-4", name: "Rachel Park", avatarUrl: null, online: false },
];

const osGrindersMembers: GroupMember[] = [
  { id: "user-1", name: "Apostolos Geyer", avatarUrl: null, online: true },
  { id: "user-5", name: "Daniel Fernandez", avatarUrl: null, online: false },
  { id: "user-6", name: "Emily Zhang", avatarUrl: null, online: true },
];

const comboProofsMembers: GroupMember[] = [
  { id: "user-1", name: "Apostolos Geyer", avatarUrl: null, online: true },
  { id: "user-7", name: "Nadia Hussein", avatarUrl: null, online: false },
];

export const MOCK_STUDY_GROUPS: StudyGroup[] = [
  { id: "group-1", name: "DB Study Crew", courseId: "course-cs348", courseCode: "CS 348", schoolId: "school-uw", members: dbStudyCrewMembers, maxMembers: 6 },
  { id: "group-2", name: "OS Grinders", courseId: "course-cs350", courseCode: "CS 350", schoolId: "school-uw", members: osGrindersMembers, maxMembers: 5 },
  { id: "group-3", name: "Combo Proofs", courseId: "course-math239", courseCode: "MATH 239", schoolId: "school-uw", members: comboProofsMembers, maxMembers: 4 },
];

/* ─── Messages (DB Study Crew) ─── */

export const MOCK_MESSAGES: Message[] = [
  { id: "msg-1", groupId: "group-1", senderId: "user-2", senderName: "Priya Sharma", content: "Has anyone started A2 yet? The SQL joins question looks tricky.", timestamp: "2026-03-10T18:30:00Z" },
  { id: "msg-2", groupId: "group-1", senderId: "user-3", senderName: "Kevin Liu", content: "Yeah I got stuck on Q3 with the nested subqueries. Want to meet up tomorrow?", timestamp: "2026-03-10T18:45:00Z" },
  { id: "msg-3", groupId: "group-1", senderId: "user-1", senderName: "Apostolos Geyer", content: "I'm down. DC library around 2pm?", timestamp: "2026-03-10T19:02:00Z" },
  { id: "msg-4", groupId: "group-1", senderId: "user-4", senderName: "Rachel Park", content: "I can make it at 2:30, save me a seat!", timestamp: "2026-03-10T19:15:00Z" },
  { id: "msg-5", groupId: "group-1", senderId: "user-2", senderName: "Priya Sharma", content: "Perfect. I'll book a group study room on LibCal.", timestamp: "2026-03-10T19:20:00Z" },
  { id: "msg-6", groupId: "group-1", senderId: "user-3", senderName: "Kevin Liu", content: "Does anyone have notes on relational algebra from last lecture? I missed it.", timestamp: "2026-03-11T10:00:00Z" },
  { id: "msg-7", groupId: "group-1", senderId: "user-1", senderName: "Apostolos Geyer", content: "I uploaded the PDF to DueDeck, check the documents tab.", timestamp: "2026-03-11T10:15:00Z" },
  { id: "msg-8", groupId: "group-1", senderId: "user-3", senderName: "Kevin Liu", content: "Legend, thanks!", timestamp: "2026-03-11T10:18:00Z" },
  { id: "msg-9", groupId: "group-1", senderId: "user-4", senderName: "Rachel Park", content: "Reminder: midterm is March 20. We should do a review session the weekend before.", timestamp: "2026-03-11T14:30:00Z" },
  { id: "msg-10", groupId: "group-1", senderId: "user-2", senderName: "Priya Sharma", content: "Good idea. Saturday afternoon works for me. Let's finalize after A2 is done.", timestamp: "2026-03-11T14:45:00Z" },
];

/* ─── Calendar Connections ─── */

export const MOCK_CALENDAR_CONNECTIONS: CalendarConnection[] = [
  { provider: "google", connected: true, email: "ajgeyer@gmail.com" },
  { provider: "microsoft", connected: false, email: null },
  { provider: "apple", connected: false, email: null },
];

/* ─── Reminder Preferences ─── */

export const MOCK_REMINDER_PREFERENCES: ReminderPreference[] = [
  { channel: "push", enabled: true, offsetMinutes: 1440 },   // 1 day before
  { channel: "email", enabled: true, offsetMinutes: 4320 },   // 3 days before
];

/* ─── Schools ─── */

export const MOCK_SCHOOLS: School[] = [
  { id: "school-uw", name: "University of Waterloo", shortName: "UW", studentCount: 1247, courseCount: 89 },
  { id: "school-wlu", name: "Wilfrid Laurier University", shortName: "WLU", studentCount: 634, courseCount: 42 },
  { id: "school-uoft", name: "University of Toronto", shortName: "UofT", studentCount: 2103, courseCount: 156 },
];

/* ─── Enrollments (user → section) ─── */

export const MOCK_ENROLLMENTS: Enrollment[] = [
  { userId: "user-1", sectionId: "sec-cs348-w26-001", enrolledAt: "2026-01-06T09:00:00Z" },
  { userId: "user-1", sectionId: "sec-cs350-w26-001", enrolledAt: "2026-01-06T09:05:00Z" },
  { userId: "user-1", sectionId: "sec-math239-w26-001", enrolledAt: "2026-01-06T09:10:00Z" },
  { userId: "user-1", sectionId: "sec-cs370-w26-001", enrolledAt: "2026-01-06T09:15:00Z" },
  { userId: "user-1", sectionId: "sec-stat230-w26-001", enrolledAt: "2026-01-06T09:20:00Z" },
];

/* ─── Browse Courses (aggregate view for discovery) ─── */

export const MOCK_BROWSE_COURSES: BrowseCourse[] = [
  { id: "course-cs348", schoolId: "school-uw", code: "CS 348", name: "Intro to Databases", studentCount: 47, groupCount: 3, documentCount: 2, sectionCount: 2 },
  { id: "course-cs350", schoolId: "school-uw", code: "CS 350", name: "Operating Systems", studentCount: 62, groupCount: 4, documentCount: 1, sectionCount: 1 },
  { id: "course-math239", schoolId: "school-uw", code: "MATH 239", name: "Intro to Combinatorics", studentCount: 38, groupCount: 2, documentCount: 1, sectionCount: 2 },
  { id: "course-cs370", schoolId: "school-uw", code: "CS 370", name: "Numerical Computation", studentCount: 29, groupCount: 1, documentCount: 1, sectionCount: 1 },
  { id: "course-stat230", schoolId: "school-uw", code: "STAT 230", name: "Probability", studentCount: 55, groupCount: 3, documentCount: 0, sectionCount: 2 },
  { id: "course-bu283", schoolId: "school-wlu", code: "BU 283", name: "Corporate Finance", studentCount: 31, groupCount: 2, documentCount: 0, sectionCount: 1 },
  { id: "course-ec120", schoolId: "school-wlu", code: "EC 120", name: "Intro to Microeconomics", studentCount: 22, groupCount: 1, documentCount: 0, sectionCount: 1 },
  { id: "course-csc263", schoolId: "school-uoft", code: "CSC 263", name: "Data Structures & Analysis", studentCount: 74, groupCount: 5, documentCount: 0, sectionCount: 2 },
  { id: "course-mat237", schoolId: "school-uoft", code: "MAT 237", name: "Multivariable Calculus", studentCount: 58, groupCount: 3, documentCount: 0, sectionCount: 1 },
];

/* ─── Browse Sections (shown after picking a course) ─── */

export const MOCK_BROWSE_SECTIONS: BrowseSection[] = [
  { id: "sec-cs348-w26-001", courseId: "course-cs348", term: "Winter 2026", section: "001", instructor: "Grant Cheston", studentCount: 28, documentCount: 2 },
  { id: "sec-cs348-w26-002", courseId: "course-cs348", term: "Winter 2026", section: "002", instructor: "Ihab Ilyas", studentCount: 19, documentCount: 0 },
  { id: "sec-cs350-w26-001", courseId: "course-cs350", term: "Winter 2026", section: "001", instructor: "Lesley Istead", studentCount: 62, documentCount: 1 },
  { id: "sec-math239-w26-001", courseId: "course-math239", term: "Winter 2026", section: "001", instructor: "Martin Pei", studentCount: 22, documentCount: 1 },
  { id: "sec-math239-w26-002", courseId: "course-math239", term: "Winter 2026", section: "002", instructor: "David Wagner", studentCount: 16, documentCount: 0 },
  { id: "sec-cs370-w26-001", courseId: "course-cs370", term: "Winter 2026", section: "001", instructor: "Jeff Orchard", studentCount: 29, documentCount: 1 },
  { id: "sec-stat230-w26-001", courseId: "course-stat230", term: "Winter 2026", section: "001", instructor: "Dina Dawoud", studentCount: 33, documentCount: 0 },
  { id: "sec-stat230-w26-002", courseId: "course-stat230", term: "Winter 2026", section: "002", instructor: "Michael Wallace", studentCount: 22, documentCount: 0 },
];

/* ─── Helper Functions ─── */

export function getDeadlinesForSection(sectionId: string): Deadline[] {
  return MOCK_DEADLINES.filter((d) => d.sectionId === sectionId);
}

export function getGradeWeightsForSection(sectionId: string): GradeWeight[] {
  return MOCK_GRADE_WEIGHTS.filter((w) => w.sectionId === sectionId);
}

export function getCourse(courseId: string): Course | undefined {
  return MOCK_COURSES.find((c) => c.id === courseId);
}

export function getSection(sectionId: string): CourseSection | undefined {
  return MOCK_SECTIONS.find((s) => s.id === sectionId);
}

export function getSectionsForCourse(courseId: string): CourseSection[] {
  return MOCK_SECTIONS.filter((s) => s.courseId === courseId);
}

export function getEnrolledSections(userId: string): CourseSection[] {
  const enrolledIds = MOCK_ENROLLMENTS.filter((e) => e.userId === userId).map((e) => e.sectionId);
  return MOCK_SECTIONS.filter((s) => enrolledIds.includes(s.id));
}

export function isEnrolled(userId: string, sectionId: string): boolean {
  return MOCK_ENROLLMENTS.some((e) => e.userId === userId && e.sectionId === sectionId);
}

export function getDocumentsForSection(sectionId: string): Document[] {
  return MOCK_DOCUMENTS.filter((d) => d.sectionId === sectionId);
}

export function getCourseForSection(sectionId: string): Course | undefined {
  const section = getSection(sectionId);
  return section ? getCourse(section.courseId) : undefined;
}
