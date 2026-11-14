import { globSync, readFileSync } from "node:fs";

const ID = String.raw`["'\`]([A-Za-z][A-Za-z0-9-]*-[es]?\d+):`;
const SPEC_ID = /^- ([A-Za-z][A-Za-z0-9-]*-[es]?\d+):/gm;
const TEST_ID = new RegExp(
  String.raw`(?:\b(?:test|it)(?:\.\w+)?|\))\(\s*${ID}`,
  "g",
);
const NAME_ID = new RegExp(String.raw`^\s*name:\s*${ID}`, "gm");

const collect = (files: string[], res: RegExp[]) => {
  const ids = new Map<string, string[]>();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const re of res) {
      for (const [, id] of text.matchAll(re)) {
        ids.set(id!, [...(ids.get(id!) ?? []), file]);
      }
    }
  }
  return ids;
};

const specs = collect(globSync("docs/specs/**/*.md"), [SPEC_ID]);
const tests = collect(
  globSync("{apps,packages,e2e}/**/*.{test,spec,stories}.{ts,tsx}", {
    exclude: (name) => name.includes("node_modules"),
  }),
  [TEST_ID, NAME_ID],
);

const errors: string[] = [];
for (const [id, files] of specs) {
  if (files.length > 1) errors.push(`${id}: 仕様書内でIDが重複しています`);
  const found = tests.get(id) ?? [];
  if (found.length !== 1) {
    errors.push(`${id}: テストが${found.length}件あります(1件にしてください)`);
    continue;
  }
  const file = found[0]!;
  if (/-e\d+$/.test(id) && !file.startsWith("e2e/")) {
    errors.push(`${id}: -eのテストはe2e配下に書いてください (${file})`);
  }
  if (
    /-s\d+$/.test(id) &&
    !/^apps\/web\/app\/pages\/.*\.stories\.tsx$/.test(file)
  ) {
    errors.push(
      `${id}: -sのテストはapps/web/app/pages配下のstoryに書いてください (${file})`,
    );
  }
}
for (const [id, files] of tests) {
  if (!specs.has(id)) {
    errors.push(`${id}: 仕様書にないIDのテストがあります (${files[0]})`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${specs.size} spec ids`);
