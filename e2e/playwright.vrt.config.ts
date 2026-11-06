import { defineConfig, devices } from "@playwright/test";

const schemes = ["light", "dark"] as const;
const devicesByName = {
  pc: { viewport: { width: 1280, height: 800 } },
  mobile: devices["Pixel 7"],
};

export default defineConfig({
  testDir: "./vrt",
  snapshotPathTemplate: "baseline/{projectName}/{arg}{ext}",
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/vrt.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:6006",
    launchOptions: { args: ["--font-render-hinting=none"] },
  },
  expect: { toHaveScreenshot: { animations: "disabled" } },
  projects: schemes.flatMap((colorScheme) =>
    Object.entries(devicesByName).map(([name, device]) => ({
      name: `${colorScheme}-${name}`,
      use: { ...device, colorScheme },
    })),
  ),
  webServer: {
    command:
      "python3 -m http.server 6006 -b 127.0.0.1 -d ../apps/web/storybook-static",
    url: "http://127.0.0.1:6006/index.json",
    stderr: "ignore",
  },
});
