import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { RepostRepository } from "../../../infrastructure/repost-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { RepostIndexingPolicy } from "../../domain/repost-indexing-policy.js";
import { RepostIndexer } from "./repost-indexer.js";

let repostIndexer: RepostIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  repostIndexer = testSetup.testInjector
    .provideClass("repostRepository", RepostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
    .injectClass(RepostIndexer);
  ctx = testSetup.ctx;
});

describe("RepostIndexer", () => {
  describe("upsert", () => {
    it("リポストレコードを正しく保存する", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:reposter",
          handle: "reposter.bsky.social",
        },
        {
          did: "did:plc:author",
          handle: "author.bsky.social",
        },
      ]);

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:author/app.bsky.feed.post/123",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/123",
        cid: "repost123",
        actorDid: "did:plc:reposter",
        json: repostJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/123",
        cid: "repost123",
        json: repostJson,
      });

      // Act
      await repostIndexer.upsert({ ctx, record });

      // Assert
      const reposts = await ctx.db
        .select()
        .from(schema.reposts)
        .where(eq(schema.reposts.uri, record.uri.toString()))
        .limit(1);
      expect(reposts.length).toBe(1);
      expect(reposts[0]?.actorDid).toBe("did:plc:reposter");
      expect(reposts[0]?.subjectUri).toBe(
        "at://did:plc:author/app.bsky.feed.post/123",
      );
    });
  });
});
