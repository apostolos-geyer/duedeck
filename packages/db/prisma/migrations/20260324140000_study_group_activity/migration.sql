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

-- CreateIndex
CREATE INDEX "study_group_activity_groupId_createdAt_idx" ON "study_group_activity"("groupId", "createdAt");

-- AddForeignKey
ALTER TABLE "study_group_activity" ADD CONSTRAINT "study_group_activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_group_activity" ADD CONSTRAINT "study_group_activity_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_group_activity" ADD CONSTRAINT "study_group_activity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
