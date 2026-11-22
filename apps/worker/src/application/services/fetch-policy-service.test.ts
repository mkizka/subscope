import { fakeCid, fakeDid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import type { Origin } from "../dto/origin.js";
import { parseRecord } from "../dto/parsed-record.js";
import { parsePost } from "../dto/post.js";
import { recordFactory } from "../dto/record.factory.js";
import type { Record } from "../dto/record.js";

const authorOf = (record: Record) => ({
  did: record.uri.did,
  isMember: false,
  tracking: null,
});

const postRecord = (uri: `at://${string}`) =>
  recordFactory({
    uri,
    json: {
      $type: "app.bsky.feed.post",
      text: "hello",
      createdAt: new Date().toISOString(),
    },
  });

describe("FetchPolicyService", () => {
  let fetchPolicyService: TestServices["fetchPolicyService"];
  let postRepository: TestServices["postRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    fetchPolicyService = services.fetchPolicyService;
    postRepository = services.postRepository;
    db = services.db;
  });

  const targetsFor = (record: Record, origin: Origin) =>
    fetchPolicyService.targetsForRecord({
      ctx: { db },
      parsed: parseRecord(record),
      author: authorOf(record),
      origin,
    });

  const recordTargetUris = async (record: Record) => {
    const targets = await targetsFor(record, { type: "tapLive" });
    return targets.flatMap((target) =>
      target.type === "record" ? [target.uri.toString()] : [],
    );
  };

  test("fetchRecord-8: レコードの作者のプロフィールとハンドルは、保存していなければ取得する", async () => {
    // arrange
    const did = fakeDid();
    const record = postRecord(`at://${did}/app.bsky.feed.post/123`);

    // act
    const targets = await targetsFor(record, { type: "tapLive" });

    // assert
    expect(targets).toEqual([
      { type: "handle", did },
      { type: "profile", did },
    ]);
  });

  test.each<{ origin: Origin; expected: number[] }>([
    { origin: { type: "tapLive" }, expected: [1] },
    { origin: { type: "tapPast" }, expected: [1] },
    { origin: { type: "pds", hop: 1 }, expected: [2] },
    { origin: { type: "pds", hop: 2 }, expected: [] },
  ])(
    "fetchRecord-7: Tapから届いたレコードから辿って取得するのは、2段先までにする($origin.type, $origin.hop)",
    async ({ origin, expected }) => {
      // arrange
      const quotedUri = `at://${fakeDid()}/app.bsky.feed.post/quoted` as const;
      const record = recordFactory({
        uri: `at://${fakeDid()}/app.bsky.feed.post/123`,
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
      const targets = await targetsFor(record, origin);

      // assert
      const hops = targets.flatMap((target) =>
        target.type === "record" && target.uri.toString() === quotedUri
          ? [target.hop]
          : [],
      );
      expect(hops).toEqual(expected);
    },
  );

  test.each([
    { name: "未保存", saved: false, expected: true },
    { name: "保存済み", saved: true, expected: false },
  ])(
    "fetchRecord-5: 引用された投稿とフィードは、保存していなければ取得する($name)",
    async ({ saved, expected }) => {
      // arrange
      const quotedUri = `at://${fakeDid()}/app.bsky.feed.post/quoted` as const;
      if (saved) {
        postRepository.add(parsePost(postRecord(quotedUri)).post);
      }
      const record = recordFactory({
        uri: `at://${fakeDid()}/app.bsky.feed.post/123`,
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
      const uris = await recordTargetUris(record);

      // assert
      expect(uris.includes(quotedUri)).toBe(expected);
    },
  );

  test.each([
    { name: "未保存", saved: false, expected: true },
    { name: "保存済み", saved: true, expected: false },
  ])(
    "fetchRecord-6: リポストされた投稿は、保存していなければ取得する($name)",
    async ({ saved, expected }) => {
      // arrange
      const subjectUri =
        `at://${fakeDid()}/app.bsky.feed.post/subject` as const;
      if (saved) {
        postRepository.add(parsePost(postRecord(subjectUri)).post);
      }
      const record = recordFactory({
        uri: `at://${fakeDid()}/app.bsky.feed.repost/123`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: { uri: subjectUri, cid: fakeCid() },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const uris = await recordTargetUris(record);

      // assert
      expect(uris.includes(subjectUri)).toBe(expected);
    },
  );
});
