import { schema } from "@repo/db";
import { actorFactory, labelFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupJobTest } from "../shared/job-test-utils.js";

const src = "did:plc:ar7c4by46qjdydhdevvrndac";

describe("ラベルの保存", () => {
  const { ctx } = testSetup;

  test("label-1: 保存済みのアクターと、そのアクターのレコードに付いたラベルを保存する", async () => {
    // arrange
    const { indexLabel } = await setupJobTest();
    const actor = await actorFactory(ctx.db).create();
    const postUri = `at://${actor.did}/app.bsky.feed.post/3l3qo2vuowo2b`;

    // act
    await indexLabel({
      src,
      uri: actor.did,
      val: "!takedown",
      cts: "2026-01-01T00:00:00.000Z",
    });
    await indexLabel({
      src,
      uri: postUri,
      val: "porn",
      cts: "2026-01-01T00:00:00.000Z",
    });

    // assert
    const labels = await ctx.db.select().from(schema.labels);
    expect(labels).toEqual([
      expect.objectContaining({ uri: actor.did, actorDid: actor.did }),
      expect.objectContaining({ uri: postUri, actorDid: actor.did }),
    ]);
  });

  test("label-2: 保存していないアクターへのラベルは保存しない", async () => {
    // arrange
    const { indexLabel } = await setupJobTest();

    // act
    await indexLabel({
      src,
      uri: "did:plc:unknown",
      val: "!takedown",
      cts: "2026-01-01T00:00:00.000Z",
    });

    // assert
    const labels = await ctx.db.select().from(schema.labels);
    expect(labels).toHaveLength(0);
  });

  test("label-3: negがtrueのラベルを受け取ったら、同じラベルを削除する", async () => {
    // arrange
    const { indexLabel } = await setupJobTest();
    const label = await labelFactory(ctx.db).create();

    // act
    await indexLabel({
      src: label.src,
      uri: label.uri,
      val: label.val,
      neg: true,
      cts: "2026-01-01T00:00:00.000Z",
    });

    // assert
    const labels = await ctx.db.select().from(schema.labels);
    expect(labels).toHaveLength(0);
  });
});
