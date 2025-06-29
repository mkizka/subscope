import type { TransactionContext } from "@repo/common/domain";
import { Follow, Record } from "@repo/common/domain";
import {
  actorFactory,
  recordFactory,
  setupTestDatabase,
  subscriptionFactory,
} from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { FollowIndexingPolicy } from "./follow-indexing-policy.js";

let followIndexingPolicy: FollowIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  followIndexingPolicy = testSetup.testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(FollowIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("FollowIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("フォロワーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const followerActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:follower",
          handle: () => "follower.bsky.social",
        })
        .create();
      const followeeActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:followee",
          handle: () => "followee.bsky.social",
        })
        .create();

      // フォロワーをsubscriberとして登録
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => followerActor })
              .props({
                uri: () =>
                  "at://did:plc:follower/dev.mkizka.test.subscription/123",
                cid: () => "sub123",
              })
              .create(),
        })
        .props({
          uri: () => "at://did:plc:follower/dev.mkizka.test.subscription/123",
          cid: () => "sub123",
        })
        .create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:follower/app.bsky.graph.follow/123",
        cid: "follow123",
        json: followJson,
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
      const followerActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:follower2",
          handle: () => "follower2.bsky.social",
        })
        .create();
      const followeeActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:followee2",
          handle: () => "followee2.bsky.social",
        })
        .create();

      // フォロイーをsubscriberとして登録
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => followeeActor })
              .props({
                uri: () =>
                  "at://did:plc:followee2/dev.mkizka.test.subscription/456",
                cid: () => "sub456",
              })
              .create(),
        })
        .props({
          uri: () => "at://did:plc:followee2/dev.mkizka.test.subscription/456",
          cid: () => "sub456",
        })
        .create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee2",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:follower2/app.bsky.graph.follow/456",
        cid: "follow456",
        json: followJson,
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
      await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:unrelated-follower",
          handle: () => "unrelated-follower.bsky.social",
        })
        .create();
      await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:unrelated-followee",
          handle: () => "unrelated-followee.bsky.social",
        })
        .create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:unrelated-followee",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated-follower/app.bsky.graph.follow/789",
        cid: "follow789",
        json: followJson,
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
