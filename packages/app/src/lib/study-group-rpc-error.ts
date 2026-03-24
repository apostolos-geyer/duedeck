/** True when the RPC error means the user is no longer in the study group. */
export function isNotStudyGroupMemberError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const o = error as Record<string, unknown>;
  const code = o.code;
  const data = o.data;
  if (code === "FORBIDDEN" && data && typeof data === "object") {
    const msg = (data as { message?: unknown }).message;
    if (msg === "not_a_member") return true;
  }
  const message = String(o.message ?? "");
  return (
    message.includes("not_a_member") ||
    message.includes('"message":"not_a_member"')
  );
}
