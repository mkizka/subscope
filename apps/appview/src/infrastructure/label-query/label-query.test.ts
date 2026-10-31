import { labelFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { LabelQuery } from "./label-query.js";

describe("LabelQuery", () => {
  const { ctx } = testSetup;

  const labelQuery = new LabelQuery(ctx.db);

  describe("findBySubjects", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await labelQuery.findBySubjects([]);

      // assert
      expect(result).toEqual([]);
    });

    test("指定された対象の期限切れでないラベルだけを返す", async () => {
      // arrange
      const [label, expired] = await Promise.all([
        labelFactory(ctx.db).create(),
        labelFactory(ctx.db)
          .props({ exp: () => new Date(Date.now() - 1000) })
          .create(),
        labelFactory(ctx.db).create(),
      ]);

      // act
      const result = await labelQuery.findBySubjects([label.uri, expired.uri]);

      // assert
      expect(result).toEqual([
        { src: label.src, uri: label.uri, val: label.val },
      ]);
    });
  });
});
