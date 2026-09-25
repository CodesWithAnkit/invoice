import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * E2E tests run against a LOCAL Supabase stack (`npx supabase start`), never the
 * hosted project. The app under test is started on port 3100 with its Supabase
 * env overridden to the local stack, so it cannot touch real data.
 *
 * It builds into `.next-e2e` (NEXT_DIST_DIR), so it can run alongside your own
 * `npm run dev`, which keeps using `.next` and the hosted project.
 */
const E2E_PORT = 3100;
const BASE_URL = `http://localhost:${E2E_PORT}`;

function loadLocalSupabaseEnv() {
  // Resolved once in the runner; workers inherit it through process.env.
  if (process.env.E2E_SUPABASE_URL) return;
  let status: Record<string, string>;
  try {
    status = JSON.parse(
      execSync('npx supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
    );
  } catch {
    throw new Error('Local Supabase is not running. Start it with `npx supabase start`, then re-run the tests.');
  }
  process.env.E2E_SUPABASE_URL = status.API_URL;
  process.env.E2E_SUPABASE_ANON_KEY = status.ANON_KEY;
  process.env.E2E_SUPABASE_SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY;
  process.env.E2E_MAILPIT_URL = status.MAILPIT_URL ?? status.INBUCKET_URL;
}

loadLocalSupabaseEnv();

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      // Backend E2E: real HTTP against the running app + local Supabase.
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      testIgnore: /api\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Use prepared auth state.
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      testIgnore: /api\/.*\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run the app against the local Supabase stack */
  webServer: {
    command: `npx next dev -p ${E2E_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY!,
    },
  },
});
