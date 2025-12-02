import { Follow, Record } from "@repo/common/domain";
import {
  actorFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository/subscription-repository.js";
import { FollowIndexingPolicy } from "./follow-indexing-policy.js";

describe("FollowIndexingPolicy", () => {
  const { testInjector, ctx } = testSetup;

  const followIndexingPolicy = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(FollowIndexingPolicy);

  describe("shouldIndex", () => {
    test("フォロワーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const [followerActor, followeeActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      // フォロワーをsubscriberとして登録
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => followerActor })
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

    test("フォロイーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const [followerActor, followeeActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      // フォロイーをsubscriberとして登録
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => followeeActor })
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

    test("フォロワーもフォロイーもsubscriberでない場合は保存すべきでない", async () => {
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
