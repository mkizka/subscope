import { AtUri } from "@atproto/syntax";
import { fakeCid, fakeDid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import type { Origin } from "../dto/origin.js";
import { parseRecord } from "../dto/parsed-record.js";
import { recordFactory } from "../dto/record.factory.js";

describe("FetchPolicyService", () => {
  let fetchPolicyService: TestServices["fetchPolicyService"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    fetchPolicyService = services.fetchPolicyService;
    db = services.db;
  });

  test("作者のハンドルとプロフィールがない場合、ハンドルとプロフィールを返す", async () => {
    // arrange
    const did = fakeDid();
    const record = recordFactory({
      uri: `at://${did}/app.bsky.feed.post/123`,
      json: {
        $type: "app.bsky.feed.post",
        text: "hello",
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const targets = await fetchPolicyService.targetsForRecord({
      ctx: { db },
      parsed: parseRecord(record),
      author: { did, isMember: false },
      origin: { type: "tapLive" },
    });

    // assert
    expect(targets).toEqual([
      { type: "handle", did },
      {
        type: "record",
        uri: AtUri.make(did, "app.bsky.actor.profile", "self"),
        hop: 1,
      },
    ]);
  });

  test.each<{ origin: Origin; expected: number[] }>([
    { origin: { type: "tapLive" }, expected: [1] },
    { origin: { type: "tapPast" }, expected: [1] },
    { origin: { type: "pds", hop: 1 }, expected: [2] },
    { origin: { type: "pds", hop: 2 }, expected: [] },
  ])(
    "引用された投稿は2段目まで返す($origin.type, $origin.hop)",
    async ({ origin, expected }) => {
      // arrange
      const quotedUri = `at://${fakeDid()}/app.bsky.feed.post/quoted`;
      const did = fakeDid();
      const record = recordFactory({
        uri: `at://${did}/app.bsky.feed.post/123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "quote",
          embed: {
            $type: "app.bsky.embed.record",
            record: { uri: quotedUri, cid: fakeCid() },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const targets = await fetchPolicyService.targetsForRecord({
        ctx: { db },
        parsed: parseRecord(record),
        author: { did, isMember: false },
        origin,
      });

      // assert
      const hops = targets.flatMap((target) =>
        target.type === "record" && target.uri.toString() === quotedUri
          ? [target.hop]
          : [],
      );
      expect(hops).toEqual(expected);
    },
  );
});
