import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

// Helpers for auth E2E tests. Everything here talks to the LOCAL Supabase
// stack configured in playwright.config.ts.

export const TEST_PASSWORD = 'Correct-Horse-42';

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; is local Supabase running?`);
  return value;
}

export function adminClient() {
  return createClient(env('E2E_SUPABASE_URL'), env('E2E_SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.test`;
}

/** Create a user directly (bypassing the UI), confirmed unless told otherwise. */
export async function createUser(
  prefix: string,
  { confirmed = true, password = TEST_PASSWORD }: { confirmed?: boolean; password?: string } = {}
) {
  const email = uniqueEmail(prefix);
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: confirmed,
    user_metadata: { full_name: 'E2E User' },
  });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

export async function signInViaUi(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

type MailpitMessage = { ID: string; Subject: string; To: { Address: string }[] };

/** Wait for the newest email to `to` (optionally matching a subject) and return its links. */
export async function latestEmailLinks(to: string, subject?: RegExp): Promise<string[]> {
  const base = env('E2E_MAILPIT_URL');
  let message: MailpitMessage | undefined;
  await expect
    .poll(
      async () => {
        const res = await fetch(`${base}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
        const body = (await res.json()) as { messages: MailpitMessage[] };
        message = body.messages.find((m) => !subject || subject.test(m.Subject));
        return Boolean(message);
      },
      { message: `email to ${to}`, timeout: 15_000 }
    )
    .toBe(true);

  const res = await fetch(`${base}/api/v1/message/${message!.ID}`);
  const { HTML, Text } = (await res.json()) as { HTML: string; Text: string };
  const hrefs = [...(HTML ?? '').matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  return hrefs.length ? hrefs : [...(Text ?? '').matchAll(/https?:\/\/\S+/g)].map((m) => m[0]);
}

export async function countEmailsTo(to: string) {
  const res = await fetch(
    `${env('E2E_MAILPIT_URL')}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
  );
  const body = (await res.json()) as { messages: MailpitMessage[] };
  return body.messages.length;
}

/** Fail on serious/critical axe violations (WCAG 2.1 A/AA). */
export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    'serious/critical accessibility violations'
  ).toEqual([]);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
}
