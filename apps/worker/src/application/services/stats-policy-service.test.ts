import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import { parseRecord } from "../dto/parsed-record.js";
import { recordFactory } from "../dto/record.factory.js";

describe("StatsPolicyService", () => {
  let statsPolicyService: TestServices["statsPolicyService"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    statsPolicyService = services.statsPolicyService;
  });

  test("投稿の場合、作者の投稿数と、投稿・リプライ先・引用元の集計を対象にする", () => {
    // arrange
    const author = accountFactory();
    const parentUri = "at://did:plc:parent/app.bsky.feed.post/parent";
    const quotedUri = "at://did:plc:quoted/app.bsky.feed.post/quoted";
    const parent = { uri: parentUri, cid: fakeCid() };
    const record = recordFactory({
      uri: `at://${author.did}/app.bsky.feed.post/reply`,
      json: {
        $type: "app.bsky.feed.post",
        text: "reply",
        reply: { root: parent, parent },
        embed: {
          $type: "app.bsky.embed.record",
          record: { uri: quotedUri, cid: fakeCid() },
        },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const targets = statsPolicyService.targetsFor(parseRecord(record));

    // assert
    expect(targets).toEqual({
      accounts: [author.did],
      posts: [record.uri, new AtUri(parentUri), new AtUri(quotedUri)],
    });
  });

  test.each([
    { collection: "app.bsky.feed.like" },
    { collection: "app.bsky.feed.repost" },
  ])("$collection の場合、対象の投稿の集計を対象にする", ({ collection }) => {
    // arrange
    const subjectUri = "at://did:plc:author/app.bsky.feed.post/123";
    const record = recordFactory({
      uri: AtUri.make(accountFactory().did, collection, "rkey").toString(),
      json: {
        $type: collection,
        subject: { uri: subjectUri, cid: fakeCid() },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const targets = statsPolicyService.targetsFor(parseRecord(record));

    // assert
    expect(targets).toEqual({ accounts: [], posts: [new AtUri(subjectUri)] });
  });

  test("フォローの場合、フォローした側とされた側のアカウントの集計を対象にする", () => {
    // arrange
    const follower = accountFactory();
    const followee = accountFactory();
    const record = recordFactory({
      uri: `at://${follower.did}/app.bsky.graph.follow/followrkey`,
      json: {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const targets = statsPolicyService.targetsFor(parseRecord(record));

    // assert
    expect(targets).toEqual({
      accounts: [follower.did, followee.did],
      posts: [],
    });
  });
});
