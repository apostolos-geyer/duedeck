-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "school" TEXT,
    "program" TEXT,
    "currentTerm" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT,
    "filename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "parsedS3Key" TEXT,
    "uploadedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "extractedData" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsedDeadlineCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,

    CONSTRAINT "school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_section" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'blue',

    CONSTRAINT "course_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deadline" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_weight" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "grade_weight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 6,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_activity" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "providerAccountId" TEXT,
    "scope" TEXT,

    CONSTRAINT "calendar_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_link" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "offsetMinutes" INTEGER NOT NULL,

    CONSTRAINT "reminder_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "document_sectionId_contentHash_idx" ON "document"("sectionId", "contentHash");

-- CreateIndex
CREATE INDEX "document_uploadedById_idx" ON "document"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "school_shortName_key" ON "school"("shortName");

-- CreateIndex
CREATE INDEX "course_schoolId_idx" ON "course"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "course_schoolId_code_key" ON "course"("schoolId", "code");

-- CreateIndex
CREATE INDEX "course_section_courseId_idx" ON "course_section"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_section_courseId_term_section_key" ON "course_section"("courseId", "term", "section");

-- CreateIndex
CREATE INDEX "enrollment_userId_idx" ON "enrollment"("userId");

-- CreateIndex
CREATE INDEX "enrollment_sectionId_idx" ON "enrollment"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_userId_sectionId_key" ON "enrollment"("userId", "sectionId");

-- CreateIndex
CREATE INDEX "deadline_sectionId_idx" ON "deadline"("sectionId");

-- CreateIndex
CREATE INDEX "deadline_dueDate_idx" ON "deadline"("dueDate");

-- CreateIndex
CREATE INDEX "grade_weight_sectionId_idx" ON "grade_weight"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "study_group_sectionId_key" ON "study_group"("sectionId");

-- CreateIndex
CREATE INDEX "study_group_courseId_idx" ON "study_group"("courseId");

-- CreateIndex
CREATE INDEX "study_group_sectionId_idx" ON "study_group"("sectionId");

-- CreateIndex
CREATE INDEX "study_group_activity_groupId_createdAt_idx" ON "study_group_activity"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "study_group_member_groupId_userId_key" ON "study_group_member"("groupId", "userId");

-- CreateIndex
CREATE INDEX "message_groupId_createdAt_idx" ON "message"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "direct_message_senderId_recipientId_createdAt_idx" ON "direct_message"("senderId", "recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "direct_message_recipientId_senderId_createdAt_idx" ON "direct_message"("recipientId", "senderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connection_userId_provider_key" ON "calendar_connection"("userId", "provider");

-- CreateIndex
CREATE INDEX "calendar_event_link_userId_provider_idx" ON "calendar_event_link"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_link_userId_deadlineId_provider_key" ON "calendar_event_link"("userId", "deadlineId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_preference_userId_channel_key" ON "reminder_preference"("userId", "channel");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_weight" ADD CONSTRAINT "grade_weight_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_activity" ADD CONSTRAINT "study_group_activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_activity" ADD CONSTRAINT "study_group_activity_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_activity" ADD CONSTRAINT "study_group_activity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_member" ADD CONSTRAINT "study_group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_member" ADD CONSTRAINT "study_group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connection" ADD CONSTRAINT "calendar_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_link" ADD CONSTRAINT "calendar_event_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_link" ADD CONSTRAINT "calendar_event_link_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_preference" ADD CONSTRAINT "reminder_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
