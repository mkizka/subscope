import { Generator, Record } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  getTestSetup,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository.js";
import { GeneratorIndexingPolicy } from "./generator-indexing-policy.js";

describe("GeneratorIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();

  const generatorIndexingPolicy = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(GeneratorIndexingPolicy);

  describe("shouldIndex", () => {
    it("subscriberが作成したgeneratorは保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => subscriberActor })
              .create(),
        })
        .create();

      const generatorJson = {
        $type: "app.bsky.feed.generator",
        did: "did:web:example.com",
        displayName: "Test Generator",
        description: "A test feed generator",
        createdAt: new Date().toISOString(),
      };
      const generatorRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.generator",
      )
        .vars({ actor: () => subscriberActor })
        .props({ json: () => generatorJson })
        .create();
      const record = Record.fromJson({
        uri: generatorRecord.uri,
        cid: generatorRecord.cid,
        json: generatorJson,
        indexedAt: new Date(),
      });

      // act
      const result = await generatorIndexingPolicy.shouldIndex(
        ctx,
        Generator.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("subscriberにフォローされているユーザーが作成したgeneratorは保存すべきでない", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => subscriberActor })
              .create(),
        })
        .create();

      const followedActor = await actorFactory(ctx.db).create();

      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => subscriberActor })
              .create(),
          followee: () => followedActor,
        })
        .create();

      const generatorJson = {
        $type: "app.bsky.feed.generator",
        did: "did:web:example.com",
        displayName: "Followed Generator",
        description: "A generator by followed user",
        createdAt: new Date().toISOString(),
      };
      const generatorRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.generator",
      )
        .vars({ actor: () => followedActor })
        .props({ json: () => generatorJson })
        .create();
      const record = Record.fromJson({
        uri: generatorRecord.uri,
        cid: generatorRecord.cid,
        json: generatorJson,
        indexedAt: new Date(),
      });

      // act
      const result = await generatorIndexingPolicy.shouldIndex(
        ctx,
        Generator.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    it("subscriberでもフォローされているユーザーでもない場合は保存すべきでない", async () => {
      // arrange
      const unrelatedActor = await actorFactory(ctx.db).create();

      const generatorJson = {
        $type: "app.bsky.feed.generator",
        did: "did:web:example.com",
        displayName: "Unrelated Generator",
        description: "A generator by unrelated user",
        createdAt: new Date().toISOString(),
      };
      const generatorRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.generator",
      )
        .vars({ actor: () => unrelatedActor })
        .props({ json: () => generatorJson })
        .create();
      const record = Record.fromJson({
        uri: generatorRecord.uri,
        cid: generatorRecord.cid,
        json: generatorJson,
        indexedAt: new Date(),
      });

      // act
      const result = await generatorIndexingPolicy.shouldIndex(
        ctx,
        Generator.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
