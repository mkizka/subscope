import { asDid } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { schema } from "@repo/db";
import {
  accountFactory,
  postFactory,
  randomCid,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupJobTest as setupBase } from "../shared/job-test-utils.js";

const setupJobTest = async () => {
  const jobTest = await setupBase();
  jobTest.webPushSender.clear();
  jobTest.jobScheduler.clear();
  return jobTest;
};

type Nsid = `${string}.${string}.${string}`;

let count = 0;
const nextRev = () => String(++count).padStart(13, "0");

const createEvent = async ({
  did,
  collection,
  rkey = `rkey${++count}`,
  record,
  action = "create",
}: {
  did: string;
  collection: Nsid;
  rkey?: string;
  record: Record<string, unknown>;
  action?: "create" | "update";
}): Promise<RecordEvent> => ({
  id: 1,
  type: "record",
  action,
  did: asDid(did),
  rev: nextRev(),
  collection,
  rkey,
  cid: await randomCid(),
  record: {
    $type: collection,
    createdAt: new Date().toISOString(),
    ...record,
  },
  live: true,
});

const deleteEvent = (
  did: string,
  collection: Nsid,
  rkey: string,
): RecordEvent => ({
  id: 1,
  type: "record",
  action: "delete",
  did: asDid(did),
  rev: nextRev(),
  collection,
  rkey,
  live: true,
});

describe("プッシュ通知の送信", () => {
  const { ctx } = testSetup;

  const subscribe = async (accountDid: string) => {
    const endpoint = `https://push.example.com/${++count}`;
    await ctx.db
      .insert(schema.pushSubscriptions)
      .values({ endpoint, accountDid, p256dh: "p256dh", auth: "auth" });
    return endpoint;
  };

  const createMember = async () => {
    const member = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => member })
            .create(),
      })
      .props({ text: () => "メンバーの投稿" })
      .create();
    return { member, post };
  };

  const likeEvent = (did: string, post: { uri: string; cid: string }) =>
    createEvent({
      did,
      collection: "app.bsky.feed.like",
      record: { subject: { uri: post.uri, cid: post.cid } },
    });

  test("push-1: 通知を新しく作ると、受け取るメンバーが登録したすべての端末にプッシュ通知を送る", async () => {
    // arrange
    const { indexCommit, runSendPushNotificationJobs, webPushSender } =
      await setupJobTest();
    const { member, post } = await createMember();
    const liker = await accountFactory(ctx.db).create();
    const endpoints = [
      await subscribe(member.did),
      await subscribe(member.did),
    ];
    await subscribe(liker.did);

    // act
    await indexCommit(await likeEvent(liker.did, post));
    await runSendPushNotificationJobs();

    // assert
    expect(webPushSender.getSent().map((s) => s.endpoint)).toEqual(endpoints);
  });

  test("push-2: すでに保存していた通知は、レコードの更新や再受信で作り直しても送らない", async () => {
    // arrange
    const { indexCommit, jobScheduler } = await setupJobTest();
    const { member, post } = await createMember();
    const liker = await accountFactory(ctx.db).create();
    const event = await likeEvent(liker.did, post);

    // act
    await indexCommit(event);
    await indexCommit({ ...event, action: "update", rev: nextRev() });

    // assert
    expect(jobScheduler.getSendPushNotificationJobs()).toMatchObject([
      { recipientDid: member.did },
    ]);
  });

  test("push-3: 送る前に取り消された通知は送らない", async () => {
    // arrange
    const { indexCommit, runSendPushNotificationJobs, webPushSender } =
      await setupJobTest();
    const { member, post } = await createMember();
    const liker = await accountFactory(ctx.db).create();
    await subscribe(member.did);
    const event = await likeEvent(liker.did, post);
    await indexCommit(event);

    // act
    await indexCommit(deleteEvent(liker.did, event.collection, event.rkey));
    await runSendPushNotificationJobs();

    // assert
    expect(webPushSender.getSent()).toEqual([]);
  });

  const reasons = [
    {
      name: "like",
      title: "テスト太郎さんがいいねしました",
      body: "メンバーの投稿",
      event: (author: string, post: { uri: string; cid: string }) =>
        likeEvent(author, post),
    },
    {
      name: "repost",
      title: "テスト太郎さんがリポストしました",
      body: "メンバーの投稿",
      event: (author: string, post: { uri: string; cid: string }) =>
        createEvent({
          did: author,
          collection: "app.bsky.feed.repost",
          record: { subject: { uri: post.uri, cid: post.cid } },
        }),
    },
    {
      name: "follow",
      title: "テスト太郎さんにフォローされました",
      body: "",
      event: (author: string, _post: unknown, memberDid: string) =>
        createEvent({
          did: author,
          collection: "app.bsky.graph.follow",
          record: { subject: memberDid },
        }),
    },
    {
      name: "reply",
      title: "テスト太郎さんが返信しました",
      body: "返信です",
      event: (author: string, post: { uri: string; cid: string }) =>
        createEvent({
          did: author,
          collection: "app.bsky.feed.post",
          record: {
            text: "返信です",
            reply: {
              root: { uri: post.uri, cid: post.cid },
              parent: { uri: post.uri, cid: post.cid },
            },
          },
        }),
    },
    {
      name: "quote",
      title: "テスト太郎さんが引用しました",
      body: "引用です",
      event: (author: string, post: { uri: string; cid: string }) =>
        createEvent({
          did: author,
          collection: "app.bsky.feed.post",
          record: {
            text: "引用です",
            embed: {
              $type: "app.bsky.embed.record",
              record: { uri: post.uri, cid: post.cid },
            },
          },
        }),
    },
    {
      name: "mention",
      title: "テスト太郎さんがメンションしました",
      body: "メンションです",
      event: (author: string, _post: unknown, memberDid: string) =>
        createEvent({
          did: author,
          collection: "app.bsky.feed.post",
          record: {
            text: "メンションです",
            facets: [
              {
                index: { byteStart: 0, byteEnd: 1 },
                features: [
                  { $type: "app.bsky.richtext.facet#mention", did: memberDid },
                ],
              },
            ],
          },
        }),
    },
  ];

  test.each(reasons)(
    "push-4: タイトルと本文を、通知の種類に合わせて設計書の表のとおりにする ($name)",
    async ({ title, body, event }) => {
      // arrange
      const { indexCommit, runSendPushNotificationJobs, webPushSender } =
        await setupJobTest();
      const { member, post } = await createMember();
      const author = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "テスト太郎" }))
        .create();
      await subscribe(member.did);

      // act
      await indexCommit(await event(author.did, post, member.did));
      await runSendPushNotificationJobs();

      // assert
      expect(webPushSender.getSent()).toMatchObject([
        { payload: { title, body } },
      ]);
    },
  );

  test("push-5: いいねとリポストは、同じ投稿への同じ種類の通知が端末上で1件にまとまるようにする", async () => {
    // arrange
    const { indexCommit, runSendPushNotificationJobs, webPushSender } =
      await setupJobTest();
    const { member, post } = await createMember();
    const otherPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => member })
            .create(),
      })
      .create();
    const likers = await Promise.all([
      accountFactory(ctx.db).create(),
      accountFactory(ctx.db).create(),
    ]);
    await subscribe(member.did);

    // act
    await indexCommit(await likeEvent(likers[0].did, post));
    await indexCommit(await likeEvent(likers[1].did, post));
    await indexCommit(await likeEvent(likers[0].did, otherPost));
    await runSendPushNotificationJobs();

    // assert
    const tags = webPushSender.getSent().map((s) => s.payload.tag);
    expect(tags[0]).toBe(tags[1]);
    expect(tags[2]).not.toBe(tags[0]);
  });

  test("push-6: プッシュサーバーが404か410を返した端末の登録を削除する", async () => {
    // arrange
    const { indexCommit, runSendPushNotificationJobs, webPushSender } =
      await setupJobTest();
    const { member, post } = await createMember();
    const liker = await accountFactory(ctx.db).create();
    const goneEndpoint = await subscribe(member.did);
    const aliveEndpoint = await subscribe(member.did);
    webPushSender.markGone(goneEndpoint);

    // act
    await indexCommit(await likeEvent(liker.did, post));
    await runSendPushNotificationJobs();

    // assert
    const rows = await ctx.db.select().from(schema.pushSubscriptions);
    expect(rows.map((r) => r.endpoint)).toContain(aliveEndpoint);
    expect(rows.map((r) => r.endpoint)).not.toContain(goneEndpoint);
  });
});
