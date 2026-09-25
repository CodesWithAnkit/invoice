import { NextResponse } from "next/server";

// Response helpers matching the AGENTS.md contract:
//   success → { success: true, data }   failure → { error: "message" }

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Log the real error server-side; return a generic message to the client. */
export function serverError(context: string, error: unknown) {
  console.error(`${context}:`, error);
  return fail("Something went wrong. Try again.", 500);
}
