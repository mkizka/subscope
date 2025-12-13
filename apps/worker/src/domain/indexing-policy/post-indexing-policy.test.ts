import { Post } from "@repo/common/domain";
import { fakeCid, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { PostIndexingPolicy } from "./post-indexing-policy.js";

describe("PostIndexingPolicy", () => {
  const postIndexingPolicy = testInjector.injectClass(PostIndexingPolicy);

  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  describe("shouldIndex", () => {
    test("subscriberの投稿は保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${subscriberDid}/app.bsky.feed.post/123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("追跡アクターの投稿は保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";
      const followeeDid = "did:plc:followee456";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(followeeDid);

      const record = recordFactory({
        uri: `at://${followeeDid}/app.bsky.feed.post/123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post from followed user",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("subscribersへのリプライは保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";
      const replierDid = "did:plc:replier456";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${replierDid}/app.bsky.feed.post/reply123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "reply to subscriber",
          reply: {
            parent: {
              uri: `at://${subscriberDid}/app.bsky.feed.post/original123`,
              cid: fakeCid(),
            },
            root: {
              uri: `at://${subscriberDid}/app.bsky.feed.post/original123`,
              cid: fakeCid(),
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("subscriberでもフォロワーでもないユーザーの投稿は保存すべきでない", async () => {
      // arrange
      const unrelatedDid = "did:plc:unrelated123";

      const record = recordFactory({
        uri: `at://${unrelatedDid}/app.bsky.feed.post/123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "unrelated post",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(false);
    });

    test("追跡アクターでない投稿への返信は保存すべきでない", async () => {
      // arrange
      const replierDid = "did:plc:replier123";

      const record = recordFactory({
        uri: `at://${replierDid}/app.bsky.feed.post/reply456`,
        json: {
          $type: "app.bsky.feed.post",
          text: "reply to non-existent post",
          reply: {
            parent: {
              uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
              cid: fakeCid(),
            },
            root: {
              uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
              cid: fakeCid(),
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(false);
    });

    test("追跡アクターへのリプライは保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";
      const followeeDid = "did:plc:followee456";
      const replierDid = "did:plc:replier789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(followeeDid);

      const record = recordFactory({
        uri: `at://${replierDid}/app.bsky.feed.post/reply123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "reply to followee post",
          reply: {
            parent: {
              uri: `at://${followeeDid}/app.bsky.feed.post/post123`,
              cid: fakeCid(),
            },
            root: {
              uri: `at://${followeeDid}/app.bsky.feed.post/post123`,
              cid: fakeCid(),
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("subscribersがフォローしていないユーザーへのリプライは保存すべきでない", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";
      const nonFolloweeDid = "did:plc:nonfollowee456";
      const replierDid = "did:plc:replier789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${replierDid}/app.bsky.feed.post/reply456`,
        json: {
          $type: "app.bsky.feed.post",
          text: "reply to non-followee post",
          reply: {
            parent: {
              uri: `at://${nonFolloweeDid}/app.bsky.feed.post/post123`,
              cid: fakeCid(),
            },
            root: {
              uri: `at://${nonFolloweeDid}/app.bsky.feed.post/post123`,
              cid: fakeCid(),
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(Post.from(record));

      // assert
      expect(result).toBe(false);
    });
  });
});
