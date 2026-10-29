import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node --import tsx ./dev-env/server.mts pnpm turbo run dev",
    cwd: "../..",
    url: "http://127.0.0.1:3000/health",
    timeout: 300_000,
    stdout: "pipe",
    gracefulShutdown: { signal: "SIGTERM", timeout: 30_000 },
  },
});
