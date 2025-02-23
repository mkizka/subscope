import type { IRepoFetcher } from "../application/interfaces/repo-fetcher.js";

/*
// MEMO
import { cborToLexRecord, readCar } from "@atproto/repo";
import fs from "fs";

const bytes = fs.readFileSync("a.car");
const { blocks } = await readCar(bytes);

for (const entry of blocks.entries()) {
  const record = cborToLexRecord(entry.bytes);
  // eslint-disable-next-line no-console
  console.log(record);
}
*/

export class RepoFetcher implements IRepoFetcher {
  fetch(pds: string) {
    // TODO: 実装する
    return Promise.resolve([]);
  }
}
