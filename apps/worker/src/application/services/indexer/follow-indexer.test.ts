import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { FollowIndexingPolicy } from "../../domain/follow-indexing-policy.js";
import { FollowIndexer } from "./follow-indexer.js";

let followIndexer: FollowIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  followIndexer = testSetup.testInjector
    .provideClass("followRepository", FollowRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("followIndexingPolicy", FollowIndexingPolicy)
    .injectClass(FollowIndexer);
  ctx = testSetup.ctx;
});

describe("FollowIndexer", () => {
  describe("upsert", () => {
    it("フォローレコードを正しく保存する", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:follower",
          handle: "follower.bsky.social",
        },
        {
          did: "did:plc:followee",
          handle: "followee.bsky.social",
        },
      ]);

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower/app.bsky.graph.follow/123",
        cid: "follow123",
        actorDid: "did:plc:follower",
        json: followJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:follower/app.bsky.graph.follow/123",
        cid: "follow123",
        json: followJson,
      });

      // Act
      await followIndexer.upsert({ ctx, record });

      // Assert
      const follows = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follows.length).toBe(1);
      expect(follows[0]?.actorDid).toBe("did:plc:follower");
      expect(follows[0]?.subjectDid).toBe("did:plc:followee");
    });
  });
});
