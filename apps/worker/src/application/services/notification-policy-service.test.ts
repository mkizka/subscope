import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { randomCid } from "@repo/test-utils";
import { assert, beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import type { Origin } from "../dto/origin.js";
import { parseRecord } from "../dto/parsed-record.js";
import { postFactory } from "../dto/post.factory.js";
import { recordFactory } from "../dto/record.factory.js";

const mention = (did: string) => ({
  index: { byteStart: 0, byteEnd: 1 },
  features: [{ $type: "app.bsky.richtext.facet#mention", did }],
});

describe("NotificationPolicyService", () => {
  let notificationPolicyService: TestServices["notificationPolicyService"];
  let registrationQuery: TestServices["registrationQuery"];
  let postRepo: TestServices["postRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    notificationPolicyService = services.notificationPolicyService;
    registrationQuery = services.registrationQuery;
    postRepo = services.postRepository;
    db = services.db;
  });

  const likeRecord = (likerDid: string, authorDid: string) =>
    recordFactory({
      uri: `at://${likerDid}/app.bsky.feed.like/likerkey`,
      json: {
        $type: "app.bsky.feed.like",
        subject: {
          uri: `at://${authorDid}/app.bsky.feed.post/123`,
          cid: fakeCid(),
        },
        createdAt: new Date().toISOString(),
      },
    });

  test.each([
    {
      name: "notify-1: 通知はメンバー宛てにだけ作る",
      isRegistered: false,
      isSelf: false,
      expected: [],
    },
    {
      name: "notify-2: 自分自身の操作では通知を作らない",
      isRegistered: true,
      isSelf: true,
      expected: [],
    },
    {
      name: "notify-3: いいねされた投稿の作者に like の通知を作る",
      isRegistered: true,
      isSelf: false,
      expected: [{ reason: "like" }],
    },
  ])("$name", async ({ isRegistered, isSelf, expected }) => {
    // arrange
    const liker = accountFactory();
    const author = isSelf ? liker : accountFactory();
    registrationQuery.add(liker.did);
    if (isRegistered) {
      registrationQuery.add(author.did);
    }
    const record = likeRecord(liker.did, author.did);

    // act
    const notifications = await notificationPolicyService.notificationsFor({
      ctx: { db },
      parsed: parseRecord(record),
      origin: { type: "tapLive" },
    });

    // assert
    expect(notifications).toMatchObject(expected);
  });

  test("notify-4: リポストされた投稿の作者に repost の通知を作る", async () => {
    // arrange
    const reposter = accountFactory();
    const author = accountFactory();
    registrationQuery.add(author.did);
    const subjectUri = `at://${author.did}/app.bsky.feed.post/123`;
    const record = recordFactory({
      uri: `at://${reposter.did}/app.bsky.feed.repost/repostrkey`,
      json: {
        $type: "app.bsky.feed.repost",
        subject: { uri: subjectUri, cid: fakeCid() },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const notifications = await notificationPolicyService.notificationsFor({
      ctx: { db },
      parsed: parseRecord(record),
      origin: { type: "tapLive" },
    });

    // assert
    expect(notifications).toMatchObject([
      {
        recordUri: record.uri.toString(),
        recipientDid: author.did,
        authorDid: reposter.did,
        reason: "repost",
        reasonSubject: subjectUri,
      },
    ]);
  });

  test("notify-5: フォローされたアカウントに follow の通知を作る", async () => {
    // arrange
    const follower = accountFactory();
    const followee = accountFactory();
    registrationQuery.add(followee.did);
    const record = recordFactory({
      uri: `at://${follower.did}/app.bsky.graph.follow/followrkey`,
      json: {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const notifications = await notificationPolicyService.notificationsFor({
      ctx: { db },
      parsed: parseRecord(record),
      origin: { type: "tapLive" },
    });

    // assert
    expect(notifications).toMatchObject([
      {
        recordUri: record.uri.toString(),
        recipientDid: followee.did,
        authorDid: follower.did,
        reason: "follow",
        reasonSubject: null,
      },
    ]);
  });

  test("notify-6: リプライの親投稿から4つ上までの投稿の作者に reply の通知を作る", async () => {
    // arrange
    const ancestors = [];
    for (let i = 0; i < 5; i++) {
      const account = accountFactory();
      registrationQuery.add(account.did);
      const { post } = postFactory({
        accountDid: account.did,
        uri: AtUri.make(
          account.did,
          "app.bsky.feed.post",
          `ancestor${i}`,
        ).toString(),
        replyParent: ancestors[0] && {
          uri: ancestors[0].uri,
          cid: ancestors[0].cid,
        },
      });
      postRepo.add(post);
      ancestors.unshift(post);
    }
    const [parent] = ancestors;
    assert(parent);
    const record = recordFactory({
      uri: `at://${accountFactory().did}/app.bsky.feed.post/reply`,
      json: {
        $type: "app.bsky.feed.post",
        text: "reply",
        reply: {
          root: { uri: parent.uri.toString(), cid: parent.cid },
          parent: { uri: parent.uri.toString(), cid: parent.cid },
        },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const notifications = await notificationPolicyService.notificationsFor({
      ctx: { db },
      parsed: parseRecord(record),
      origin: { type: "tapLive" },
    });

    // assert
    expect(notifications).toMatchObject(
      ancestors.slice(0, 4).map((ancestor) => ({
        recipientDid: ancestor.accountDid,
        reason: "reply",
        reasonSubject: ancestor.uri.toString(),
      })),
    );
  });

  test("notify-7: 引用された投稿の作者に quote の、メンションされたアカウントに mention の通知を作る", async () => {
    // arrange
    const quoted = accountFactory();
    const mentioned = accountFactory();
    registrationQuery.add(quoted.did);
    registrationQuery.add(mentioned.did);
    const quotedUri = `at://${quoted.did}/app.bsky.feed.post/quoted`;
    const record = recordFactory({
      uri: `at://${accountFactory().did}/app.bsky.feed.post/notify`,
      json: {
        $type: "app.bsky.feed.post",
        text: "@",
        embed: {
          $type: "app.bsky.embed.record",
          record: { uri: quotedUri, cid: await randomCid() },
        },
        facets: [mention(mentioned.did)],
        createdAt: new Date().toISOString(),
      },
    });

    // act
    const notifications = await notificationPolicyService.notificationsFor({
      ctx: { db },
      parsed: parseRecord(record),
      origin: { type: "tapLive" },
    });

    // assert
    expect(notifications).toMatchObject([
      { recipientDid: mentioned.did, reason: "mention" },
      { recipientDid: quoted.did, reason: "quote", reasonSubject: quotedUri },
    ]);
  });

  test.each([
    { name: "mention", withMention: true, expected: "mention" },
    { name: "quote", withMention: false, expected: "quote" },
  ])(
    "notify-8: 1つの投稿から同じ相手への通知は mention、quote、reply の優先順で1件にする ($name)",
    async ({ withMention, expected }) => {
      // arrange
      const recipient = accountFactory();
      registrationQuery.add(recipient.did);
      const subject = {
        uri: `at://${recipient.did}/app.bsky.feed.post/subject`,
        cid: await randomCid(),
      };
      const record = recordFactory({
        uri: `at://${accountFactory().did}/app.bsky.feed.post/notify`,
        json: {
          $type: "app.bsky.feed.post",
          text: "@",
          reply: { root: subject, parent: subject },
          embed: { $type: "app.bsky.embed.record", record: subject },
          facets: withMention ? [mention(recipient.did)] : [],
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const notifications = await notificationPolicyService.notificationsFor({
        ctx: { db },
        parsed: parseRecord(record),
        origin: { type: "tapLive" },
      });

      // assert
      expect(notifications).toMatchObject([
        { recipientDid: recipient.did, reason: expected },
      ]);
    },
  );

  test.each<{ name: string; origin: Origin }>([
    { name: "バックフィルで受け取ったレコード", origin: { type: "tapPast" } },
    { name: "取得しに行ったレコード", origin: { type: "pds", hop: 1 } },
  ])(
    "notify-9: 通知はTapからリアルタイムに受け取ったレコードでだけ作り、バックフィルや取得しに行ったレコードでは作らない ($name)",
    async ({ origin }) => {
      // arrange
      const liker = accountFactory();
      const author = accountFactory();
      registrationQuery.add(author.did);
      const record = likeRecord(liker.did, author.did);

      // act
      const notifications = await notificationPolicyService.notificationsFor({
        ctx: { db },
        parsed: parseRecord(record),
        origin,
      });

      // assert
      expect(notifications).toEqual([]);
    },
  );
});
