import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import { recordFactory } from "../dto/record.factory.js";

describe("StatsPolicyService", () => {
  let statsPolicyService: TestServices["statsPolicyService"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    statsPolicyService = services.statsPolicyService;
  });

  test("aggregate-5: 投稿の保存・削除で、作者の投稿数、返信先の返信数、引用元の引用数を数え直す", () => {
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
    const targets = statsPolicyService.targetsFor(record);

    // assert
    expect(targets).toEqual({
      accounts: [author.did],
      posts: expect.arrayContaining([
        new AtUri(parentUri),
        new AtUri(quotedUri),
      ]),
    });
  });

  test("aggregate-6: 投稿を保存したら、先に保存されていたその投稿へのいいね・リポスト・返信・引用も数える", () => {
    // arrange
    const record = recordFactory({
      uri: `at://${accountFactory().did}/app.bsky.feed.post/123`,
      json: {
        $type: "app.bsky.feed.post",
        text: "hello",
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const targets = statsPolicyService.targetsFor(record);

    // assert
    expect(targets.posts).toEqual([record.uri]);
  });

  test.each([
    { collection: "app.bsky.feed.like" },
    { collection: "app.bsky.feed.repost" },
  ])(
    "aggregate-7: いいね・リポストの保存・削除で、対象の投稿のいいね数・リポスト数を数え直す($collection)",
    ({ collection }) => {
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
      const targets = statsPolicyService.targetsFor(record);

      // assert
      expect(targets).toEqual({ accounts: [], posts: [new AtUri(subjectUri)] });
    },
  );

  test("aggregate-8: フォローの保存・削除で、フォローした人のフォロー数とされた人のフォロワー数を数え直す", () => {
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
    const targets = statsPolicyService.targetsFor(record);

    // assert
    expect(targets).toEqual({
      accounts: [follower.did, followee.did],
      posts: [],
    });
  });
});
