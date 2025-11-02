/* eslint-disable @typescript-eslint/unbound-method */
import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/repositories/actor-repository.js";
import type { JobLogger } from "../../../shared/job.js";
import type { IRepoFetcher } from "../../interfaces/external/repo-fetcher.js";
import type { IndexRecordService } from "../../services/index-record-service.js";
import { SyncRepoUseCase } from "./sync-repo-use-case.js";

vi.mock("../../../shared/env.js", () => ({
  env: { BACKFILL_BATCH_SIZE: 2, INDEX_LEVEL: 1 },
}));

const mockRepoFetcher = mock<IRepoFetcher>();
const mockJobLogger = mock<JobLogger>();
const mockIndexRecordService = mock<IndexRecordService>();

const { testInjector, ctx } = testSetup;
const syncRepoUseCase = testInjector
  .provideValue("repoFetcher", mockRepoFetcher)
  .provideValue("indexRecordService", mockIndexRecordService)
  .provideClass("actorRepository", ActorRepository)
  .injectClass(SyncRepoUseCase);

describe("SyncRepoUseCase", () => {
  test("レコードがバッチサイズで分割されて処理される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    const records = Array.from({ length: 5 }, (_, i) =>
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", `${i + 1}`).toString(),
        cid: `cid${i + 1}`,
        json: { record: {} },
        indexedAt: new Date(),
      }),
    );
    mockRepoFetcher.fetch.mockResolvedValue(records);

    // act
    await syncRepoUseCase.execute({ did, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(5);
  });

  test("レコードが0件の場合、処理されない", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    mockRepoFetcher.fetch.mockResolvedValue([]);

    // act
    await syncRepoUseCase.execute({ did, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).not.toHaveBeenCalled();
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did));
    expect(actors[0]?.syncRepoStatus).toBe("synchronized");
    expect(actors[0]?.syncRepoVersion).toBe(1);
  });

  test("サポートされていないコレクションはフィルタリングされる", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    const records = [
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
        cid: "cid1",
        json: { record: {} },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "unsupported.collection", "1").toString(),
        cid: "cid2",
        json: { record: {} },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.like", "1").toString(),
        cid: "bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a",
        json: { record: {} },
        indexedAt: new Date(),
      }),
    ];
    mockRepoFetcher.fetch.mockResolvedValue(records);

    // act
    await syncRepoUseCase.execute({ did, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(2);
    expect(mockIndexRecordService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ record: records[0] }),
    );
    expect(mockIndexRecordService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ record: records[2] }),
    );
  });

  test("Actorが見つからない場合、エラーがスローされる", async () => {
    // arrange
    const did = asDid("did:plc:notfound");
    mockRepoFetcher.fetch.mockResolvedValue([]);

    // act & assert
    await expect(
      syncRepoUseCase.execute({ did, jobLogger: mockJobLogger }),
    ).rejects.toThrow(`Actor not found: ${did}`);
  });

  test("バッチ処理完了後、ステータスがsynchronizedに更新される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    mockRepoFetcher.fetch.mockResolvedValue([
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
        cid: "cid1",
        json: { record: {} },
        indexedAt: new Date(),
      }),
    ]);

    // act
    await syncRepoUseCase.execute({ did, jobLogger: mockJobLogger });

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did));
    expect(actors[0]?.syncRepoStatus).toBe("synchronized");
    expect(actors[0]?.syncRepoVersion).toBe(1);
  });

  test("フォローレコードが他のレコードより先に処理される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    const records = [
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
        cid: "cid1",
        json: { record: {} },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.graph.follow", "1").toString(),
        cid: "cid2",
        json: { record: {} },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.feed.like", "1").toString(),
        cid: "cid3",
        json: { record: {} },
        indexedAt: new Date(),
      }),
      Record.fromJson({
        uri: AtUri.make(did, "app.bsky.graph.follow", "2").toString(),
        cid: "cid4",
        json: { record: {} },
        indexedAt: new Date(),
      }),
    ];
    mockRepoFetcher.fetch.mockResolvedValue(records);

    // act
    await syncRepoUseCase.execute({ did, jobLogger: mockJobLogger });

    // assert
    expect(mockIndexRecordService.upsert).toHaveBeenCalledTimes(4);
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ record: records[1] }),
    );
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ record: records[3] }),
    );
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ record: records[0] }),
    );
    expect(mockIndexRecordService.upsert).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ record: records[2] }),
    );
  });

  test("フォローレコード処理完了後、ステータスがreadyに更新される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    const followRecord = Record.fromJson({
      uri: AtUri.make(did, "app.bsky.graph.follow", "1").toString(),
      cid: "cid1",
      json: { record: {} },
      indexedAt: new Date(),
    });
    const postRecord = Record.fromJson({
      uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
      cid: "cid2",
      json: { record: {} },
      indexedAt: new Date(),
    });
    mockRepoFetcher.fetch.mockResolvedValue([followRecord, postRecord]);

    let statusAfterFollowRecords: string | undefined;
    mockIndexRecordService.upsert.mockImplementation(async ({ record }) => {
      if (record.collection === "app.bsky.feed.post") {
        const actors = await ctx.db
          .select()
          .from(schema.actors)
          .where(eq(schema.actors.did, did));
        statusAfterFollowRecords = actors[0]?.syncRepoStatus;
      }
    });

    // act
    await syncRepoUseCase.execute({ did, jobLogger: mockJobLogger });

    // assert
    expect(statusAfterFollowRecords).toBe("ready");
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did));
    expect(actors[0]?.syncRepoStatus).toBe("synchronized");
    expect(actors[0]?.syncRepoVersion).toBe(1);
  });

  test("処理中にエラーが発生した場合、ステータスがfailedに更新される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const did = asDid(actor.did);
    const record = Record.fromJson({
      uri: AtUri.make(did, "app.bsky.feed.post", "1").toString(),
      cid: "cid1",
      json: { record: {} },
      indexedAt: new Date(),
    });
    mockRepoFetcher.fetch.mockResolvedValue([record]);
    mockIndexRecordService.upsert.mockRejectedValue(new Error("Index error"));

    // act & assert
    await expect(
      syncRepoUseCase.execute({ did, jobLogger: mockJobLogger }),
    ).rejects.toThrow("Index error");

    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did));
    expect(actors[0]?.syncRepoStatus).toBe("failed");
    expect(actors[0]?.syncRepoVersion).toBe(1);
  });
});
