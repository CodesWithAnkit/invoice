// Browser-side fetch helper for our `{ success, data } | { error }` API routes.
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}
