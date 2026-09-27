import { requireBusiness, type BusinessContext } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";
import { isUuid } from "@/lib/api/validate";

// Shared shell for the quotation lifecycle routes (send / revise / archive /
// link). The SQL functions raise Q0404 (not this business's quotation), Q0409
// (not allowed from the current status, R-11) and Q0400 (invalid data).
const CODE_STATUS: Record<string, number> = { Q0404: 404, Q0409: 409, Q0400: 400 };

export type LifecycleParams = { params: Promise<{ id: string }> };

export async function lifecycleRoute(
  { params }: LifecycleParams,
  context: string,
  action: (auth: BusinessContext, id: string) => Promise<Response>
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (!isUuid(id)) return fail("Not found", 404);
    return await action(auth, id);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code && CODE_STATUS[code]) {
      const status = CODE_STATUS[code];
      return fail(status === 404 ? "Not found" : (error as { message?: string }).message ?? "Not allowed", status);
    }
    return serverError(context, error);
  }
}

export { ok, fail };
