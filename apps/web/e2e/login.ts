import type { Page } from "@playwright/test";

export const login = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("ハンドル").fill("alice.test");
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Authorize" }).click();
  await page.waitForURL("/");
};
