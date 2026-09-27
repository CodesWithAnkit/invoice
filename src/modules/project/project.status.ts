// R-18: Draft, Completed and Archived are set by the owner; every other project
// status is derived from the project's latest (non-archived) quotation.

export const MANUAL_PROJECT_STATUSES = ["Draft", "Completed", "Archived"] as const;

const FROM_QUOTATION: Record<string, string> = {
  Draft: "Estimating",
  Sent: "Quoted",
  Viewed: "Quoted",
  Accepted: "Accepted",
  Rejected: "Rejected",
  Expired: "Expired",
};

export function deriveProjectStatus(
  storedStatus: string,
  quotations: { status: string; created_at: string }[] | null | undefined
): string {
  if ((MANUAL_PROJECT_STATUSES as readonly string[]).includes(storedStatus)) return storedStatus;
  const latest = (quotations ?? [])
    .filter((q) => q.status !== "Archived")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  return (latest && FROM_QUOTATION[latest.status]) ?? storedStatus;
}
