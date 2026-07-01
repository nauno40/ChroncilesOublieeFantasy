import { defineConfig, devices } from '@playwright/test';

// The stack (frontend :5173 + API :8000) runs via docker compose; Playwright does
// not start it. Tests are launched from the official Playwright image in
// network_mode host (see scripts/e2e.sh) so the browser's XHR to the hardcoded
// http://localhost:8000/api reaches nginx. Override the base URL with PW_BASE_URL.
const baseURL = process.env.PW_BASE_URL || 'http://localhost:5173';

export default defineConfig({
    testDir: './e2e',
    // Tests share one backend DB and register users, so run them sequentially.
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    timeout: 30_000,
    // A cold backend is slow on the first request (observed during manual verif).
    expect: { timeout: 10_000 },
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
