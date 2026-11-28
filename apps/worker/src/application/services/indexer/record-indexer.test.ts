import { AtUri } from "@atproto/syntax";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { Origin } from "../../../domain/origin.js";
import { postFactory } from "../../../domain/post.factory.js";
import { recordFactory } from "../../../domain/record.factory.js";
import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../../shared/test-utils.js";

describe("RecordIndexer", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  describe("index", () => {
    test("サポートされていないコレクションの場合、エラーを投げる", async () => {
      const { recordIndexer, db } = services;
      const ctx = { db, afterCommit };
      // arrange
      const record = recordFactory({
        uri: "at://did:plc:user/unsupported.collection/123",
        json: { $type: "unsupported.collection", text: "Hello" },
      });

      // act & assert
      await expect(
        recordIndexer.index({ ctx, record, origin: Origin.live() }),
      ).rejects.toThrow("Unsupported collection: unsupported.collection");
    });

    test("index-4: null文字を含むレコードは保存しない", async () => {
      const { recordIndexer, recordRepository, db } = services;
      const ctx = { db, afterCommit };
      // arrange
      const record = recordFactory({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello\u0000World",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await recordIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(await recordRepository.find({ ctx, uri: record.uri })).toBeNull();
    });

    test("フォローレコードの場合、レコードとフォローを保存する", async () => {
      const {
        recordIndexer,
        recordRepository,
        followRepository,
        registrationQuery,
        db,
      } = services;
      const ctx = { db, afterCommit };
      // arrange
      const follower = accountFactory();
      registrationQuery.add(follower.did);
      const followee = accountFactory();
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/456`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await recordIndexer.index({ ctx, record, origin: Origin.backfill() });

      // assert
      expect(
        await recordRepository.find({ ctx, uri: record.uri }),
      ).toMatchObject({ uri: record.uri, cid: record.cid });
      expect(
        await followRepository.find({ ctx, uri: record.uri }),
      ).toMatchObject({
        accountDid: follower.did,
        subjectDid: followee.did,
      });
    });
  });

  describe("delete", () => {
    test("存在しないレコードの場合、何もしない", async () => {
      const { recordIndexer, jobScheduler, db } = services;
      const ctx = { db, afterCommit };
      // arrange
      const uri = new AtUri("at://did:plc:user/app.bsky.feed.post/missing");

      // act
      await recordIndexer.delete({ ctx, uri });

      // assert
      expect(jobScheduler.getAggregateAccountStatsDids()).toEqual([]);
    });

    test("レコードが存在する場合、削除して投稿者の統計を集計し直す", async () => {
      const { recordIndexer, recordRepository, jobScheduler, db } = services;
      const ctx = { db, afterCommit };
      // arrange
      const { record } = postFactory();
      recordRepository.add(record);

      // act
      await recordIndexer.delete({ ctx, uri: record.uri });

      // assert
      expect(await recordRepository.find({ ctx, uri: record.uri })).toBeNull();
      expect(jobScheduler.getAggregateAccountStatsDids()).toContain(
        record.uri.did,
      );
    });
  });
});
