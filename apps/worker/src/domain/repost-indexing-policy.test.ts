import { Record, Repost } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  getTestSetup,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { RepostIndexingPolicy } from "./repost-indexing-policy.js";

const { testInjector, ctx } = getTestSetup();

const repostIndexingPolicy = testInjector
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .injectClass(RepostIndexingPolicy);

describe("RepostIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("repost者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const [reposterActor, authorActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      // repost者をsubscriberとして登録
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => reposterActor })
        .props({
          uri: () =>
            `at://${reposterActor.did}/dev.mkizka.test.subscription/123`,
          cid: () => "sub123",
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ record: () => subscriptionRecord })
        .props({
          appviewDid: () => "did:web:appview.test",
        })
        .create();

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: `at://${authorActor.did}/app.bsky.feed.post/456`,
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${reposterActor.did}/app.bsky.feed.repost/123`,
        cid: "repost123",
        json: repostJson,
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        ctx,
        Repost.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("repost者のフォロワーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const [reposterActor, followerActor, authorActor] = await actorFactory(
        ctx.db,
      ).createList(3);

      // フォロワーをsubscriberとして登録
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => followerActor })
        .props({
          uri: () =>
            `at://${followerActor.did}/dev.mkizka.test.subscription/789`,
          cid: () => "sub789",
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ record: () => subscriptionRecord })
        .props({
          appviewDid: () => "did:web:appview.test",
        })
        .create();

      // フォローレコード作成
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => followerActor })
        .props({
          uri: () => `at://${followerActor.did}/app.bsky.graph.follow/987`,
          cid: () => "follow987",
        })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followRecord, followee: () => reposterActor })
        .create();

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: `at://${authorActor.did}/app.bsky.feed.post/654`,
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${reposterActor.did}/app.bsky.feed.repost/321`,
        cid: "repost321",
        json: repostJson,
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        ctx,
        Repost.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("repost者もフォロワーもsubscriberでない場合は保存すべきでない", async () => {
      // arrange
      const [reposterActor, authorActor] = await actorFactory(
        ctx.db,
      ).createList(2);

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: `at://${authorActor.did}/app.bsky.feed.post/999`,
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${reposterActor.did}/app.bsky.feed.repost/888`,
        cid: "repost888",
        json: repostJson,
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        ctx,
        Repost.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
