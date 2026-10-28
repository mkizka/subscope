import { AtUri } from "@atproto/syntax";
import { testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RecordRepository } from "./record-repository.js";

describe("RecordRepository", () => {
  const { ctx } = testSetup;
  const recordRepository = new RecordRepository();
  const uri = new AtUri("at://did:plc:xxx/app.bsky.feed.post/123");

  describe("claimRev", () => {
    test("未記録のURIの場合、trueを返す", async () => {
      // act
      const result = await recordRepository.claimRev({
        ctx,
        uri,
        rev: "3aaaaaaaaaaaa",
      });

      // assert
      expect(result).toBe(true);
    });

    test("記録済みのrevより新しいrevの場合、trueを返す", async () => {
      // arrange
      await recordRepository.claimRev({ ctx, uri, rev: "3aaaaaaaaaaaa" });

      // act
      const result = await recordRepository.claimRev({
        ctx,
        uri,
        rev: "3bbbbbbbbbbbb",
      });

      // assert
      expect(result).toBe(true);
    });

    test.each(["3aaaaaaaaaaaa", "3bbbbbbbbbbbb"])(
      "記録済みのrev以下のrev(%s)の場合、falseを返す",
      async (rev) => {
        // arrange
        await recordRepository.claimRev({ ctx, uri, rev: "3bbbbbbbbbbbb" });

        // act
        const result = await recordRepository.claimRev({ ctx, uri, rev });

        // assert
        expect(result).toBe(false);
      },
    );
  });
});
