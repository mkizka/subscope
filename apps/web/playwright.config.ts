import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on",
    video: "on",
  },
  projects: [
    { name: "login", testMatch: "login.spec.ts" },
    {
      name: "auth",
      testMatch: "auth.setup.ts",
      dependencies: ["login"],
    },
    {
      name: "app",
      testIgnore: ["login.spec.ts", "auth.setup.ts"],
      dependencies: ["auth"],
      use: { storageState: "e2e/.auth/alice.json" },
    },
  ],
  webServer: {
    command: "node --import tsx ./dev-env/server.mts pnpm turbo run dev",
    cwd: "../..",
    url: "http://127.0.0.1:3000/health",
    timeout: 300_000,
    stdout: "pipe",
    gracefulShutdown: { signal: "SIGTERM", timeout: 30_000 },
  },
});
