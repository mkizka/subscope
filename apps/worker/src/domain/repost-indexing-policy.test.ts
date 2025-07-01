import { Record, Repost } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { PostRepository } from "../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { RepostIndexingPolicy } from "./repost-indexing-policy.js";

describe("RepostIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();

  describe("INDEX_LEVEL=1", () => {
    const repostIndexingPolicy = testInjector
      .provideClass("subscriptionRepository", SubscriptionRepository)
      .provideClass("postRepository", PostRepository)
      .provideValue("indexLevel", 1)
      .injectClass(RepostIndexingPolicy);

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
        const followRecord = await recordFactory(
          ctx.db,
          "app.bsky.graph.follow",
        )
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

      it("subscribersの投稿へのリポストは保存すべき", async () => {
        // arrange
        const reposterActor = await actorFactory(ctx.db).create();

        const subscriberActor = await actorFactory(ctx.db).create();
        const subscriptionRecord = await recordFactory(
          ctx.db,
          "dev.mkizka.test.subscription",
        )
          .vars({ actor: () => subscriberActor })
          .create();
        await subscriptionFactory(ctx.db)
          .vars({ record: () => subscriptionRecord })
          .create();

        const subscriberPost = await postFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.post")
                .vars({ actor: () => subscriberActor })
                .create(),
          })
          .props({
            text: () => "subscriber post",
          })
          .create();

        const repostJson = {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: subscriberPost.uri,
            cid: subscriberPost.cid,
          },
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${reposterActor.did}/app.bsky.feed.repost/789`,
          cid: "repost789",
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

  describe("INDEX_LEVEL=2", () => {
    const repostIndexingPolicyLevel2 = testInjector
      .provideClass("subscriptionRepository", SubscriptionRepository)
      .provideClass("postRepository", PostRepository)
      .provideValue("indexLevel", 2)
      .injectClass(RepostIndexingPolicy);

    describe("shouldIndex", () => {
      it("INDEX_LEVEL=1の条件も満たす場合は保存すべき", async () => {
        // arrange
        const reposterActor = await actorFactory(ctx.db).create();
        const subscriptionRecord = await recordFactory(
          ctx.db,
          "dev.mkizka.test.subscription",
        )
          .vars({ actor: () => reposterActor })
          .create();
        await subscriptionFactory(ctx.db)
          .vars({ record: () => subscriptionRecord })
          .create();

        const authorActor = await actorFactory(ctx.db).create();

        const repostJson = {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${authorActor.did}/app.bsky.feed.post/123`,
            cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
          },
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${reposterActor.did}/app.bsky.feed.repost/456`,
          cid: "repost456",
          json: repostJson,
        });

        // act
        const result = await repostIndexingPolicyLevel2.shouldIndex(
          ctx,
          Repost.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("保存された投稿へのリポストは保存すべき", async () => {
        // arrange
        const reposterActor = await actorFactory(ctx.db).create();
        const authorActor = await actorFactory(ctx.db).create();

        const originalPost = await postFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.post")
                .vars({ actor: () => authorActor })
                .create(),
          })
          .props({
            text: () => "original post",
          })
          .create();

        const repostJson = {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: originalPost.uri,
            cid: originalPost.cid,
          },
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${reposterActor.did}/app.bsky.feed.repost/789`,
          cid: "repost789",
          json: repostJson,
        });

        // act
        const result = await repostIndexingPolicyLevel2.shouldIndex(
          ctx,
          Repost.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("INDEX_LEVEL=1では保存されない投稿へのリポストでも、INDEX_LEVEL=2では保存すべき", async () => {
        // arrange
        const reposterActor = await actorFactory(ctx.db).create();
        const nonSubscriberActor = await actorFactory(ctx.db).create();

        const nonSubscriberPost = await postFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.post")
                .vars({ actor: () => nonSubscriberActor })
                .create(),
          })
          .props({
            text: () => "non-subscriber post",
          })
          .create();

        const repostJson = {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: nonSubscriberPost.uri,
            cid: nonSubscriberPost.cid,
          },
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${reposterActor.did}/app.bsky.feed.repost/999`,
          cid: "repost999",
          json: repostJson,
        });

        // act
        const result = await repostIndexingPolicyLevel2.shouldIndex(
          ctx,
          Repost.from(record),
        );

        // assert
        expect(result).toBe(true);
      });
    });
  });
});
