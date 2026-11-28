import { asDid } from "@atproto/did";
import { schema } from "@repo/db";
import {
  accountFactory,
  followFactory,
  labelFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupJobTest } from "../shared/job-test-utils.js";

const src = "did:plc:ar7c4by46qjdydhdevvrndac";

describe("ラベルの保存", () => {
  const { ctx } = testSetup;

  test("label-1: 保存済みのアカウントと、そのレコードに付いたラベルを保存する", async () => {
    // arrange
    const { indexLabel } = await setupJobTest();
    const account = await accountFactory(ctx.db).create();
    const postUri = `at://${account.did}/app.bsky.feed.post/3l3qo2vuowo2b`;

    // act
    await indexLabel({
      src,
      uri: account.did,
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
      expect.objectContaining({ uri: account.did, accountDid: account.did }),
      expect.objectContaining({ uri: postUri, accountDid: account.did }),
    ]);
  });

  test("label-2: 保存していないアカウントのラベルは保存しない", async () => {
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

  test("label-4: メンバーと追跡アカウントに前から付いているラベルを取り寄せて保存する", async () => {
    // arrange
    const { syncAccountKind, labelFetcher } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => serverMember })
            .create(),
        followee: () => followee,
      })
      .create();
    const other = await accountFactory(ctx.db).create();
    const cts = "2026-01-01T00:00:00.000Z";
    for (const { did } of [serverMember, followee, other]) {
      labelFetcher.add({ src, uri: did, val: "!takedown", cts });
    }

    // act
    for (const { did } of [serverMember, followee, other]) {
      await syncAccountKind(asDid(did));
    }

    // assert
    const labels = await ctx.db.select().from(schema.labels);
    expect(labels.map((label) => label.uri).sort()).toEqual(
      [serverMember.did, followee.did].sort(),
    );
  });
});
