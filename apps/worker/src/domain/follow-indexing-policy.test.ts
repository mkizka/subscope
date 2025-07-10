import { Follow, Record } from "@repo/common/domain";
import {
  actorFactory,
  getTestSetup,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { FollowIndexingPolicy } from "./follow-indexing-policy.js";

describe("FollowIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();

  const followIndexingPolicy = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(FollowIndexingPolicy);

  describe("shouldIndex", () => {
    it("フォロワーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const [followerActor, followeeActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      // フォロワーをsubscriberとして登録
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => followerActor })
              .props({
                uri: () =>
                  `at://${followerActor.did}/dev.mkizka.test.subscription/123`,
                cid: () => "sub123",
              })
              .create(),
        })
        .props({
          uri: () =>
            `at://${followerActor.did}/dev.mkizka.test.subscription/123`,
          cid: () => "sub123",
        })
        .create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followeeActor.did,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => followerActor })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
        indexedAt: new Date(),
      });

      // act
      const result = await followIndexingPolicy.shouldIndex(
        ctx,
        Follow.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("フォロイーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const [followerActor, followeeActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      // フォロイーをsubscriberとして登録
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => followeeActor })
              .props({
                uri: () =>
                  `at://${followeeActor.did}/dev.mkizka.test.subscription/456`,
                cid: () => "sub456",
              })
              .create(),
        })
        .props({
          uri: () =>
            `at://${followeeActor.did}/dev.mkizka.test.subscription/456`,
          cid: () => "sub456",
        })
        .create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followeeActor.did,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => followerActor })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
        indexedAt: new Date(),
      });

      // act
      const result = await followIndexingPolicy.shouldIndex(
        ctx,
        Follow.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("フォロワーもフォロイーもsubscriberでない場合は保存すべきでない", async () => {
      // arrange
      const [followerActor, followeeActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followeeActor.did,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => followerActor })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
        indexedAt: new Date(),
      });

      // act
      const result = await followIndexingPolicy.shouldIndex(
        ctx,
        Follow.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
