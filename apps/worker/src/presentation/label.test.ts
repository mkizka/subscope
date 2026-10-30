import { asDid } from "@atproto/did";
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

  test("label-4: Tapに登録したアカウントと、そのアカウントのレコードに付いているラベルをモデレーションサービスの queryLabels で取り寄せて保存する", async () => {
    // arrange
    const { syncTapRepo, labelFetcher } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const postUri = `at://${subscriber.did}/app.bsky.feed.post/3l3qo2vuowo2b`;
    const cts = "2026-01-01T00:00:00.000Z";
    labelFetcher.add({ src, uri: subscriber.did, val: "!takedown", cts });
    labelFetcher.add({ src, uri: postUri, val: "porn", cts });
    labelFetcher.add({ src, uri: "did:plc:other", val: "!takedown", cts });

    // act
    await syncTapRepo(asDid(subscriber.did));

    // assert
    const labels = await ctx.db.select().from(schema.labels);
    expect(labels).toEqual([
      expect.objectContaining({ uri: subscriber.did }),
      expect.objectContaining({ uri: postUri }),
    ]);
  });
});
