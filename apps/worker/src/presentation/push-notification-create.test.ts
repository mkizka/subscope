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

let count = 0;

const likeEvent = async (
  did: string,
  post: { uri: string; cid: string },
  action: "create" | "update" = "create",
): Promise<RecordEvent> => ({
  id: 1,
  type: "record",
  action,
  did: asDid(did),
  rev: String(++count).padStart(13, "0"),
  collection: "app.bsky.feed.like",
  rkey: "like",
  cid: await randomCid(),
  record: {
    $type: "app.bsky.feed.like",
    createdAt: new Date().toISOString(),
    subject: { uri: post.uri, cid: post.cid },
  },
  live: true,
});

describe("プッシュ通知の送信(通知作成時)", () => {
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
            .vars({ accountDid: () => member.did })
            .create(),
      })
      .props({ text: () => "メンバーの投稿" })
      .create();
    return { member, post };
  };

  test("push-5: 通知を新しく作ると、受け取るメンバーが登録したすべての端末にプッシュ通知を送る", async () => {
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

  test("push-6: すでに保存していた通知は、レコードの更新や再受信で作り直しても送らない", async () => {
    // arrange
    const { indexCommit, jobScheduler } = await setupJobTest();
    const { member, post } = await createMember();
    const liker = await accountFactory(ctx.db).create();

    // act
    await indexCommit(await likeEvent(liker.did, post));
    await indexCommit(await likeEvent(liker.did, post, "update"));

    // assert
    expect(jobScheduler.getSendPushNotificationJobs()).toMatchObject([
      { recipientDid: member.did },
    ]);
  });
});
