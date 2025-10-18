/* eslint-disable @typescript-eslint/unbound-method */
import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  DatabaseClient,
  ITransactionManager,
  TransactionContext,
} from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { env } from "../../../shared/env.js";
import type { JobLogger } from "../../../shared/job.js";
import type { IRepoFetcher } from "../../interfaces/external/repo-fetcher.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IndexRecordService } from "../../services/index-record-service.js";
import { BackfillUseCase } from "./backfill-use-case.js";

vi.mock("../../../shared/env.js");

const testDid: Did = "did:plc:test123";
const mockJobLogger = mock<JobLogger>();
const mockRepoFetcher = mock<IRepoFetcher>();
const mockTransactionManager = mock<ITransactionManager>();
const mockIndexRecordService = mock<IndexRecordService>();
const mockActorRepository = mock<IActorRepository>();
const mockDb = mock<DatabaseClient>();
const mockTransactionContext = mock<TransactionContext>();

mockTransactionManager.transaction.mockImplementation(async (fn) => {
  await fn(mockTransactionContext);
});

const backfillUseCase = new BackfillUseCase(
  mockRepoFetcher,
  mockTransactionManager,
  mockIndexRecordService,
  mockActorRepository,
  mockDb,
);

describe("BackfillUseCase", () => {
  test("投稿とリポストの数がBACKFILL_POST_LIMIT以上の場合、制限を超えるものは除外される", async () => {
    // arrange
    vi.mocked(env).BACKFILL_POST_LIMIT = 3;

    const postRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.feed.post", "post1"),
      cid: "cid1",
      json: {},
      indexedAt: new Date(),
    });
    const repostRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.feed.repost", `repost1`),
      cid: `cid2`,
      json: {},
      indexedAt: new Date(),
    });

    mockRepoFetcher.fetch.mockResolvedValue([
      postRecord,
      repostRecord,
      postRecord,
      repostRecord,
      postRecord,
    ]);

    // act
    await backfillUseCase.execute({ did: testDid, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(3);
  });

  test("サポートされていないコレクションのレコードの場合、インデックスされない", async () => {
    // arrange
    const postRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.feed.post", "post1"),
      cid: "cid1",
      json: {},
      indexedAt: new Date(),
    });
    const unsupportedRecord = Record.fromJson({
      uri: AtUri.make(testDid, "com.example.unsupported", "record1"),
      cid: "cid2",
      json: {},
      indexedAt: new Date(),
    });

    mockRepoFetcher.fetch.mockResolvedValue([postRecord, unsupportedRecord]);

    // act
    await backfillUseCase.execute({ did: testDid, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(1);
  });

  test("BACKFILL_POST_LIMITがマイナスの場合、すべての投稿とリポストがインデックスされる", async () => {
    // arrange
    vi.mocked(env).BACKFILL_POST_LIMIT = -1;

    const postRecords = Array.from({ length: 5 }, (_, i) =>
      Record.fromJson({
        uri: AtUri.make(testDid, "app.bsky.feed.post", `post${i}`),
        cid: `cid${i}`,
        json: {},
        indexedAt: new Date(),
      }),
    );

    mockRepoFetcher.fetch.mockResolvedValue(postRecords);

    // act
    await backfillUseCase.execute({ did: testDid, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(5);
  });

  test("投稿とリポスト以外のレコードの場合、制限なくすべてインデックスされる", async () => {
    // arrange
    vi.mocked(env).BACKFILL_POST_LIMIT = 1;

    const postRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.feed.post", "post1"),
      cid: "cid1",
      json: {},
      indexedAt: new Date(),
    });
    const likeRecords = Array.from({ length: 5 }, (_, i) =>
      Record.fromJson({
        uri: AtUri.make(testDid, "app.bsky.feed.like", `like${i}`),
        cid: `cid${i}`,
        json: {},
        indexedAt: new Date(),
      }),
    );

    mockRepoFetcher.fetch.mockResolvedValue([postRecord, ...likeRecords]);

    // act
    await backfillUseCase.execute({ did: testDid, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(6);
  });

  test("複数のレコード種別が混在する場合、順序を維持してインデックスされる", async () => {
    // arrange
    vi.mocked(env).BACKFILL_POST_LIMIT = 1000;

    const postRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.feed.post", "post1"),
      cid: "cid1",
      json: {},
      indexedAt: new Date(),
    });
    const likeRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.feed.like", "like1"),
      cid: "cid2",
      json: {},
      indexedAt: new Date(),
    });
    const followRecord = Record.fromJson({
      uri: AtUri.make(testDid, "app.bsky.graph.follow", "follow1"),
      cid: "cid3",
      json: {},
      indexedAt: new Date(),
    });

    mockRepoFetcher.fetch.mockResolvedValue([
      postRecord,
      likeRecord,
      followRecord,
    ]);

    // act
    await backfillUseCase.execute({ did: testDid, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(3);
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ record: postRecord }),
    );
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ record: likeRecord }),
    );
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ record: followRecord }),
    );
  });
});
