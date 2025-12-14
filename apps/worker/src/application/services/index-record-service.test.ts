import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { describe, expect, test, vi } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { IndexRecordService } from "./index-record-service.js";

describe("IndexRecordService", () => {
  const indexRecordService = testInjector.injectClass(IndexRecordService);

  const actorRepo = testInjector.resolve("actorRepository");
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const recordRepo = testInjector.resolve("recordRepository");
  const postRepo = testInjector.resolve("postRepository");
  const followRepo = testInjector.resolve("followRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  const jobLogger = { log: vi.fn() };

  describe("upsert", () => {
    test("サポートされていないコレクションの場合、エラーを投げる", async () => {
      // arrange
      const record = Record.create({
        uri: "at://did:plc:user/unsupported.collection/123",
        cid: "cid123",
        json: {
          $type: "unsupported.collection",
          text: "Hello",
        },
      });

      // act & assert
      await expect(
        indexRecordService.upsert({ ctx, record, jobLogger, depth: 0 }),
      ).rejects.toThrow("Unsupported collection: unsupported.collection");
    });

    test("無効なレコード（null文字を含む）の場合、ログを記録して処理を終了する", async () => {
      // arrange
      const record = Record.create({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello\u0000World",
        },
      });

      // act
      await indexRecordService.upsert({ ctx, record, jobLogger, depth: 0 });

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Invalid record: null character found",
      );
    });

    test("保存条件を満たさない場合、ログを記録して処理を終了する", async () => {
      // arrange
      const record = Record.create({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello World",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await indexRecordService.upsert({ ctx, record, jobLogger, depth: 0 });

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Record does not match storage rules, skipping",
      );
    });

    test("subscriberのフォローレコードの場合、正しく保存する", async () => {
      // arrange
      const followingActor = actorFactory();
      actorRepo.add(followingActor);

      const followerActor = actorFactory();
      actorRepo.add(followerActor);

      const subscription = subscriptionFactory({
        actorDid: followerActor.did,
      });
      subscriptionRepo.add(subscription);

      const followRecord = Record.create({
        uri: `at://${followerActor.did}/app.bsky.graph.follow/456`,
        cid: "follow-cid",
        json: {
          $type: "app.bsky.graph.follow",
          subject: followingActor.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await indexRecordService.upsert({
        ctx,
        record: followRecord,
        jobLogger,
        depth: 0,
      });

      // assert
      expect(jobLogger.log).not.toHaveBeenCalledWith(
        "Record does not match storage rules, skipping",
      );
      const savedRecord = await recordRepo.findByUri({
        ctx,
        uri: new AtUri(followRecord.uri.toString()),
      });
      expect(savedRecord).toMatchObject({
        uri: followRecord.uri,
        cid: followRecord.cid,
        actorDid: followerActor.did,
      });

      const savedFollow = followRepo.findByUri(
        new AtUri(followRecord.uri.toString()),
      );
      expect(savedFollow).toMatchObject({
        uri: followRecord.uri,
        cid: followRecord.cid,
        actorDid: followerActor.did,
        subjectDid: followingActor.did,
      });
    });
  });

  describe("delete", () => {
    test("存在しないレコードの場合、何もしない", async () => {
      // arrange
      const uri = AtUri.make(
        "at://did:plc:deleteuser/app.bsky.feed.post/delete-test",
      );

      // act
      await indexRecordService.delete({ ctx, uri });

      // assert
      const record = await recordRepo.findByUri({ ctx, uri });
      expect(record).toBeNull();
    });

    test("レコードが存在する場合、正しく削除する", async () => {
      // arrange
      const actor = actorFactory();
      actorRepo.add(actor);

      const record = recordFactory({
        uri: `at://${actor.did}/app.bsky.feed.post/test123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "Test post for deletion",
          createdAt: new Date().toISOString(),
        },
      });
      recordRepo.add(record);

      const { post } = postFactory({
        actorDid: actor.did,
        uri: record.uri.toString(),
        cid: record.cid,
      });
      postRepo.add(post);

      // act
      await indexRecordService.delete({
        ctx,
        uri: record.uri,
      });

      // assert
      const deletedRecord = await recordRepo.findByUri({
        ctx,
        uri: record.uri,
      });
      expect(deletedRecord).toBeNull();
    });
  });
});
