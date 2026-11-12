import type { Page } from "@playwright/test";

const authorize = async (page: Page) => {
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Authorize" }).click();
};

export const login = async (page: Page, handle = "alice.test", url = "/") => {
  await page.goto("/login");
  if (new URL(page.url()).pathname !== "/login") return;
  await page.getByLabel("ハンドル").fill(handle);
  await page.getByRole("button", { name: "ログイン" }).click();
  await authorize(page);
  await page.waitForURL(url);
};

export const register = async (page: Page, handle: string, code: string) => {
  await page.goto("/login?tab=register");
  await page.getByLabel("ハンドル").fill(handle);
  await page.getByLabel("招待コード").fill(code);
  await page.getByRole("button", { name: "新規登録" }).click();
  await authorize(page);
};
