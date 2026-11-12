import { schema } from "@repo/db";
import {
  accountFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupJobTest as setupBase } from "../shared/job-test-utils.js";

type Reason = (typeof schema.notifications.$inferInsert)["reason"];

const COLLECTIONS: Record<Reason, string> = {
  like: "app.bsky.feed.like",
  repost: "app.bsky.feed.repost",
  follow: "app.bsky.graph.follow",
  reply: "app.bsky.feed.post",
  quote: "app.bsky.feed.post",
  mention: "app.bsky.feed.post",
};

const setupJobTest = async () => {
  const jobTest = await setupBase();
  jobTest.webPushSender.clear();
  return jobTest;
};

let count = 0;

describe("プッシュ通知の送信", () => {
  const { ctx } = testSetup;

  const subscribe = async (accountDid: string) => {
    const endpoint = `https://push.example.com/${++count}`;
    await ctx.db
      .insert(schema.pushSubscriptions)
      .values({ endpoint, accountDid, p256dh: "p256dh", auth: "auth" });
    return endpoint;
  };

  const createMemberPost = async (member: { did: string }) =>
    await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ accountDid: () => member.did })
            .create(),
      })
      .props({ text: () => "メンバーの投稿" })
      .create();

  const createNotification = async ({
    reason,
    author,
    recipient,
    subject,
  }: {
    reason: Reason;
    author: { did: string };
    recipient: { did: string };
    subject?: { uri: string };
  }) => {
    const record = await recordFactory(ctx.db, COLLECTIONS[reason])
      .vars({ accountDid: () => author.did })
      .create();
    if (COLLECTIONS[reason] === "app.bsky.feed.post") {
      await postFactory(ctx.db)
        .vars({ record: () => record })
        .props({ text: () => `${reason}です` })
        .create();
    }
    await ctx.db.insert(schema.notifications).values({
      recordUri: record.uri,
      recipientDid: recipient.did,
      authorDid: author.did,
      reason,
      reasonSubject: subject?.uri ?? null,
      sortAt: new Date(),
    });
    return record.uri;
  };

  const createMember = async () =>
    await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

  test("push-1: 送る前に取り消された通知は送らない", async () => {
    // arrange
    const { sendPushNotification, webPushSender } = await setupJobTest();
    const member = await createMember();
    const author = await accountFactory(ctx.db).create();
    const post = await createMemberPost(member);
    await subscribe(member.did);
    const uri = await createNotification({
      reason: "like",
      author,
      recipient: member,
      subject: post,
    });
    await ctx.db
      .delete(schema.notifications)
      .where(eq(schema.notifications.recordUri, uri));

    // act
    await sendPushNotification(uri, member.did);

    // assert
    expect(webPushSender.getSent()).toEqual([]);
  });

  const reasons = [
    { reason: "like", title: "さんがいいねしました", body: "メンバーの投稿" },
    {
      reason: "repost",
      title: "さんがリポストしました",
      body: "メンバーの投稿",
    },
    { reason: "follow", title: "さんにフォローされました", body: "" },
    { reason: "reply", title: "さんが返信しました", body: "replyです" },
    { reason: "quote", title: "さんが引用しました", body: "quoteです" },
    {
      reason: "mention",
      title: "さんがメンションしました",
      body: "mentionです",
    },
  ] as const;

  test.each(reasons)(
    "push-2: タイトルと本文を、通知の種類に合わせて設計書の表のとおりにする ($reason)",
    async ({ reason, title, body }) => {
      // arrange
      const { sendPushNotification, webPushSender } = await setupJobTest();
      const member = await createMember();
      const author = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "テスト太郎" }))
        .create();
      const post = await createMemberPost(member);
      await subscribe(member.did);
      const uri = await createNotification({
        reason,
        author,
        recipient: member,
        subject: reason === "follow" ? undefined : post,
      });

      // act
      await sendPushNotification(uri, member.did);

      // assert
      expect(webPushSender.getSent()).toMatchObject([
        { payload: { title: `テスト太郎${title}`, body } },
      ]);
    },
  );

  test("push-3: いいねとリポストは、同じ投稿への同じ種類の通知が端末上で1件にまとまるようにする", async () => {
    // arrange
    const { sendPushNotification, webPushSender } = await setupJobTest();
    const member = await createMember();
    const post = await createMemberPost(member);
    const otherPost = await createMemberPost(member);
    await subscribe(member.did);
    const send = async (subject: { uri: string }) => {
      const author = await accountFactory(ctx.db).create();
      const uri = await createNotification({
        reason: "like",
        author,
        recipient: member,
        subject,
      });
      await sendPushNotification(uri, member.did);
    };

    // act
    await send(post);
    await send(post);
    await send(otherPost);

    // assert
    const tags = webPushSender.getSent().map((s) => s.payload.tag);
    expect(tags[0]).toBe(tags[1]);
    expect(tags[2]).not.toBe(tags[0]);
  });

  test("push-4: プッシュサーバーが404か410を返した端末の登録を削除する", async () => {
    // arrange
    const { sendPushNotification, webPushSender } = await setupJobTest();
    const member = await createMember();
    const author = await accountFactory(ctx.db).create();
    const post = await createMemberPost(member);
    const goneEndpoint = await subscribe(member.did);
    const aliveEndpoint = await subscribe(member.did);
    webPushSender.markGone(goneEndpoint);
    const uri = await createNotification({
      reason: "like",
      author,
      recipient: member,
      subject: post,
    });

    // act
    await sendPushNotification(uri, member.did);

    // assert
    const rows = await ctx.db.select().from(schema.pushSubscriptions);
    expect(rows.map((r) => r.endpoint)).toEqual([aliveEndpoint]);
  });
});
