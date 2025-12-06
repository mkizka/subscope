import { readFileSync } from "node:fs";
import path from "node:path";

import type { AtpBaseClient } from "@repo/client/api";
import { type IDidResolver } from "@repo/common/domain";
import { createInjector } from "typed-inject";
import { describe, expect, test, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";

import type { JobLogger } from "../../shared/job.js";
import { RepoFetcher } from "./repo-fetcher.js";

const mockClient = mockDeep<AtpBaseClient>();

vi.mock("@repo/client/api", () => {
  return {
    AtpBaseClient: function () {
      return mockClient;
    },
  };
});

const mockDidResolver = mock<IDidResolver>();
const mockJobLogger = mock<JobLogger>();

const repoFetcher = createInjector()
  .provideValue("didResolver", mockDidResolver)
  .injectClass(RepoFetcher);

const repoCar = readFileSync(
  path.join(import.meta.dirname, "fixtures", "repo.car"),
);

describe("RepoFetcher", () => {
  test("正常にリポジトリを取得出来た場合、レコードの配列に変換して返す", async () => {
    // arrange
    // 実際にverifyRepoCarを動作させるために sub.mkizka.dev の実際の情報を使用する
    const did = "did:plc:rt7d3ysf57rqchpqmjk3brc3";
    mockDidResolver.resolve.mockResolvedValue({
      pds: new URL("https://pds.mkizka.dev"),
      signingKey: "did:key:zQ3shmkscHAeywKVwjvJqW8goQJnwAPL7HnXwZzQuNmPvuy1D",
      handle: "sub.mkizka.dev",
    });
    mockClient.com.atproto.sync.getRepo.mockResolvedValue({
      success: true,
      headers: {},
      data: repoCar,
    });

    // act
    const records = await repoFetcher.fetch(did, mockJobLogger);

    // assert
    expect(records.length).toBeGreaterThan(0);
    expect(mockDidResolver.resolve).toHaveBeenCalledWith(did);
  });
});
