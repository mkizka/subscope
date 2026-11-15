import { expect, test } from "@playwright/test";

test.describe("PWA", () => {
  test("pwa-e1: マニフェストで、名前・アイコン・独立したウィンドウでの表示・開始ページ・背景色に合わせたテーマ色を宣言する", async ({
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

  test("pwa-e2: すべてのページで、マニフェストとホーム画面用のアイコンを参照する", async ({
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
