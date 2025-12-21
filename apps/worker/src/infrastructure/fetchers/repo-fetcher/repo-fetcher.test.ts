import { readFileSync } from "node:fs";
import path from "node:path";

import type { AtpBaseClient } from "@repo/client/api";
import { required } from "@repo/common/utils";
import { describe, expect, test, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { testInjector } from "../../../shared/test-utils.js";
import { RepoFetcher } from "./repo-fetcher.js";

const mockClient = mockDeep<AtpBaseClient>();

vi.mock("@repo/client/api", () => {
  return {
    AtpBaseClient: function () {
      return mockClient;
    },
  };
});

describe("RepoFetcher", () => {
  const didResolver = testInjector.resolve("didResolver");
  const jobLogger = testInjector.resolve("jobLogger");
  const repoFetcher = testInjector.injectClass(RepoFetcher);

  const repoCar = readFileSync(
    path.join(import.meta.dirname, "fixtures", "repo.car"),
  );

  test("正常にリポジトリを取得出来た場合、レコードの配列に変換して返す", async () => {
    // arrange
    // 実際にverifyRepoCarを動作させるために sub.mkizka.dev の実際の情報を使用する
    const did = "did:plc:rt7d3ysf57rqchpqmjk3brc3";
    didResolver.setResolveResult(did, {
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
    const records = await repoFetcher.fetch(did, jobLogger);

    // assert
    expect(records).not.toHaveLength(0);
    const firstPost = records.find(
      (r) => r.collection === "app.bsky.feed.post",
    );
    // lexToJsonが呼ばれていることの確認
    expect(() =>
      required(firstPost).validate("app.bsky.feed.post"),
    ).not.toThrow();
  });
});
