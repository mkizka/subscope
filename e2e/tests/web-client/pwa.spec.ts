import { expect, test } from "@playwright/test";

test.describe("PWA", () => {
  test("pwa-1: Web App Manifestで、名前・アイコン・`display: standalone`・`start_url`・DESIGN.mdのsurfaceに合わせたテーマ色を宣言する", async ({
    request,
  }) => {
    const response = await request.get("/manifest.webmanifest");

    expect(await response.json()).toMatchObject({
      name: "Subscope",
      display: "standalone",
      start_url: "/",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      icons: expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icon-512.png", sizes: "512x512" }),
      ]),
    });
    for (const path of ["/icon-192.png", "/icon-512.png"]) {
      const icon = await request.get(path);
      expect(icon.headers()["content-type"]).toBe("image/png");
    }
  });

  test("pwa-2: すべてのページのheadでManifestとapple-touch-iconを参照する", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      "/apple-touch-icon.png",
    );
  });
});
