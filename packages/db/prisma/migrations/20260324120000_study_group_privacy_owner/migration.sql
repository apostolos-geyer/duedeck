-- AlterTable
ALTER TABLE "study_group" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "study_group" ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill owner for custom groups (earliest join)
UPDATE "study_group" sg
SET "createdById" = sub."userId"
FROM (
  SELECT DISTINCT ON ("groupId") "groupId", "userId"
  FROM "study_group_member"
  ORDER BY "groupId", "joinedAt" ASC
) sub
WHERE sg.id = sub."groupId"
  AND sg."sectionId" IS NULL
  AND sg."createdById" IS NULL;
