import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";

const script = path.join(import.meta.dirname, "check-spec-tests.mts");

const run = (spec: string, testCode: string) => {
  const dir = mkdtempSync(path.join(tmpdir(), "check-specs-"));
  mkdirSync(path.join(dir, "docs/specs"), { recursive: true });
  mkdirSync(path.join(dir, "apps/appview"), { recursive: true });
  writeFileSync(path.join(dir, "docs/specs/a.md"), spec);
  writeFileSync(path.join(dir, "apps/appview/a.test.ts"), testCode);
  return spawnSync("node", [script], { cwd: dir, encoding: "utf8" });
};

const table = (...ids: string[]) =>
  [
    "| ID | 仕様 |",
    "| -- | ---- |",
    ...ids.map((id) => `| ${id}   | 文 |`),
  ].join("\n");

test("表の行の仕様IDとテストが1対1なら成功する", () => {
  const result = run(
    `- foo-1: 文\n\n${table("foo-2")}\n`,
    `test("foo-1: 文", () => {});\ntest("foo-2: 文", () => {});\n`,
  );
  expect(result.stdout).toContain("OK: 2 spec ids");
  expect(result.status).toBe(0);
});

test("表の行の仕様IDにテストがなければ失敗する", () => {
  const result = run(`${table("foo-1")}\n`, "");
  expect(result.stderr).toContain("foo-1: テストが0件あります");
  expect(result.status).toBe(1);
});

test("表とリストで仕様IDが重複していれば失敗する", () => {
  const result = run(
    `- foo-1: 文\n\n${table("foo-1")}\n`,
    `test("foo-1: 文", () => {});\n`,
  );
  expect(result.stderr).toContain("foo-1: 仕様書内でIDが重複しています");
  expect(result.status).toBe(1);
});
