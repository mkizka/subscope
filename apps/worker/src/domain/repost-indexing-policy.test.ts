import type { TransactionContext } from "@repo/common/domain";
import { Record, Repost } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  recordFactory,
  setupTestDatabase,
  subscriptionFactory,
} from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { RepostIndexingPolicy } from "./repost-indexing-policy.js";

let repostIndexingPolicy: RepostIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  repostIndexingPolicy = testSetup.testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(RepostIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("RepostIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("repost者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const reposterActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:reposter",
          handle: () => "reposter.bsky.social",
        })
        .create();
      const authorActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:author",
          handle: () => "author.bsky.social",
        })
        .create();

      // repost者をsubscriberとして登録
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => reposterActor })
        .props({
          uri: () => "at://did:plc:reposter/dev.mkizka.test.subscription/123",
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
          uri: "at://did:plc:author/app.bsky.feed.post/456",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/123",
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
      const reposterActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:reposter2",
          handle: () => "reposter2.bsky.social",
        })
        .create();
      const followerActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:follower",
          handle: () => "follower.bsky.social",
        })
        .create();
      const authorActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:author2",
          handle: () => "author2.bsky.social",
        })
        .create();

      // フォロワーをsubscriberとして登録
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => followerActor })
        .props({
          uri: () => "at://did:plc:follower/dev.mkizka.test.subscription/789",
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
          uri: () => "at://did:plc:follower/app.bsky.graph.follow/987",
          cid: () => "follow987",
        })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followRecord, followee: () => reposterActor })
        .create();

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:author2/app.bsky.feed.post/654",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:reposter2/app.bsky.feed.repost/321",
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
      const reposterActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:unrelated-reposter",
          handle: () => "unrelated-reposter.bsky.social",
        })
        .create();
      const authorActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:unrelated-author",
          handle: () => "unrelated-author.bsky.social",
        })
        .create();

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:unrelated-author/app.bsky.feed.post/999",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated-reposter/app.bsky.feed.repost/888",
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
