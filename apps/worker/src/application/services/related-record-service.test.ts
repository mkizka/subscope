import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { asHandle } from "@repo/common/utils";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { Origin } from "../../domain/origin.js";
import { recordFactory } from "../../domain/record.factory.js";
import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../shared/test-utils.js";

describe("RelatedRecordService", () => {
  let relatedRecordService: TestServices["relatedRecordService"];
  let accountRepo: TestServices["accountRepository"];
  let recordRepo: TestServices["recordRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    relatedRecordService = services.relatedRecordService;
    accountRepo = services.accountRepository;
    recordRepo = services.recordRepository;
    jobScheduler = services.jobScheduler;
    db = services.db;
  });

  describe("request", () => {
    test("保存していないレコードの場合、取得ジョブを積む", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const uri = new AtUri("at://did:plc:author/app.bsky.feed.post/missing");

      // act
      await relatedRecordService.request({ ctx, origin: Origin.live(), uri });

      // assert
      expect(jobScheduler.getFetchRecordJobs()).toEqual([
        { uri, live: true, depth: 0 },
      ]);
    });

    test.each([
      { name: "投稿", collection: "app.bsky.feed.post" },
      { name: "フィード", collection: "app.bsky.feed.generator" },
    ])(
      "fetchRecord-5: 保存済みのレコードは取得しない ($name)",
      async ({ collection }) => {
        const ctx = { db, afterCommit };
        // arrange
        const record = recordFactory({
          uri: `at://did:plc:author/${collection}/saved`,
        });
        recordRepo.add(record);

        // act
        await relatedRecordService.request({
          ctx,
          origin: Origin.live(),
          uri: record.uri,
        });

        // assert
        expect(jobScheduler.getFetchRecordJobs()).toEqual([]);
      },
    );

    test.each([
      { name: "1つ先", depth: 0, expected: [{ live: true, depth: 1 }] },
      { name: "2つ先", depth: 1, expected: [] },
    ])(
      "fetchRecord-6: 取得したレコードからさらに取得するのは、2つ先までにする ($nameのレコード)",
      async ({ depth, expected }) => {
        const ctx = { db, afterCommit };
        // arrange
        const uri = new AtUri("at://did:plc:author/app.bsky.feed.post/missing");
        const origin = Origin.fromFetchJob({ live: true, depth });

        // act
        await relatedRecordService.request({ ctx, origin, uri });

        // assert
        expect(jobScheduler.getFetchRecordJobs()).toMatchObject(expected);
      },
    );
  });

  describe("requestAccount", () => {
    test("ハンドルもプロフィールも保存していない場合、DIDの解決とプロフィールの取得ジョブを積む", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const did = asDid("did:plc:new-account");

      // act
      await relatedRecordService.requestAccount({
        ctx,
        origin: Origin.backfill(),
        did,
      });

      // assert
      expect(jobScheduler.getResolveDidJobs()).toMatchObject([
        { did, live: false },
      ]);
      expect(jobScheduler.getFetchRecordJobs()).toEqual([
        {
          uri: AtUri.make(did, "app.bsky.actor.profile", "self"),
          live: false,
          depth: 0,
        },
      ]);
    });

    test("ハンドルを保存済みの場合、DIDの解決ジョブを積まない", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const account = accountFactory({
        handle: asHandle("saved.bsky.social"),
      });
      accountRepo.add(account);

      // act
      await relatedRecordService.requestAccount({
        ctx,
        origin: Origin.live(),
        did: account.did,
      });

      // assert
      expect(jobScheduler.getResolveDidJobs()).toEqual([]);
    });
  });
});
