import { Generator } from "@repo/common/domain";
import { recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { GeneratorIndexingPolicy } from "./generator-indexing-policy.js";

describe("GeneratorIndexingPolicy", () => {
  const generatorIndexingPolicy = testInjector.injectClass(
    GeneratorIndexingPolicy,
  );

  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  describe("shouldIndex", () => {
    test("subscriberが作成したgeneratorは保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${subscriberDid}/app.bsky.feed.generator/myfeed`,
        json: {
          $type: "app.bsky.feed.generator",
          did: "did:web:example.com",
          displayName: "Test Generator",
          description: "A test feed generator",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await generatorIndexingPolicy.shouldIndex(
        Generator.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("追跡アクター(subscriberのフォロイー)が作成したgeneratorは保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";
      const followeeDid = "did:plc:followee456";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(followeeDid);

      const record = recordFactory({
        uri: `at://${followeeDid}/app.bsky.feed.generator/myfeed`,
        json: {
          $type: "app.bsky.feed.generator",
          did: "did:web:example.com",
          displayName: "Followed Generator",
          description: "A generator by followed user",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await generatorIndexingPolicy.shouldIndex(
        Generator.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscriberでもフォローされているユーザーでもない場合は保存すべきでない", async () => {
      // arrange
      const unrelatedDid = "did:plc:unrelated123";

      const record = recordFactory({
        uri: `at://${unrelatedDid}/app.bsky.feed.generator/myfeed`,
        json: {
          $type: "app.bsky.feed.generator",
          did: "did:web:example.com",
          displayName: "Unrelated Generator",
          description: "A generator by unrelated user",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await generatorIndexingPolicy.shouldIndex(
        Generator.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
