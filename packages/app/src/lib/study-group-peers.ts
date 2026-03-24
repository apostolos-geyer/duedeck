import { prisma } from "@repo/db";

/** Throws if the two users are not both members of the same study group. */
export async function assertUsersShareStudyGroup(
  a: string,
  b: string,
): Promise<void> {
  if (a === b) {
    throw new Error("no_shared_group");
  }

  const groupsA = await prisma.studyGroupMember.findMany({
    where: { userId: a },
    select: { groupId: true },
  });
  if (groupsA.length === 0) {
    throw new Error("no_shared_group");
  }

  const groupIds = groupsA.map((g) => g.groupId);
  const shared = await prisma.studyGroupMember.findFirst({
    where: { userId: b, groupId: { in: groupIds } },
  });
  if (!shared) {
    throw new Error("no_shared_group");
  }
}
