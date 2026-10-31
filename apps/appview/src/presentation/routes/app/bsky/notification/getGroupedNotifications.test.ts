import getGroupedNotifications from "@repo/client/lex/app/bsky/notification/getGroupedNotifications";
import { schema } from "@repo/db";
import {
  actorFactory,
  generatorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

const nsid = "app.bsky.notification.getGroupedNotifications";

describe("app.bsky.notification.getGroupedNotifications", () => {
  const { ctx } = testSetup;

  const setup = async () => {
    const api = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const createAuthor = () =>
      actorFactory(ctx.db)
        .use((t) => t.withProfile({}))
        .create();
    const notify = async (params: {
      reason: "like" | "repost" | "follow" | "reply" | "quote" | "mention";
      reasonSubject?: string;
      author?: Awaited<ReturnType<typeof createAuthor>>;
      sortAt?: string;
    }) => {
      const author = params.author ?? (await createAuthor());
      const post = await postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ actor: () => author })
              .create(),
        })
        .create();
      await ctx.db.insert(schema.notifications).values({
        recordUri: post.uri,
        recipientDid: viewer.did,
        authorDid: author.did,
        reason: params.reason,
        reasonSubject: params.reasonSubject ?? null,
        sortAt: new Date(params.sortAt ?? new Date()),
      });
      return { uri: post.uri, author };
    };
    const viewerPost = () =>
      postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ actor: () => viewer })
              .create(),
        })
        .create();
    api.loginAs(viewer.did);
    return { ...api, viewer, notify, viewerPost };
  };

  test("getGroupedNotifications-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getGroupedNotifications);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("getGroupedNotifications-2: 同じ投稿へのいいねとリポストは、種類ごとに1つのグループにまとめる", async () => {
    // arrange
    const { client, notify, viewerPost } = await setup();
    const post = await viewerPost();
    const like1 = await notify({ reason: "like", reasonSubject: post.uri });
    const like2 = await notify({ reason: "like", reasonSubject: post.uri });
    const repost = await notify({ reason: "repost", reasonSubject: post.uri });

    // act
    const res = await client.call(getGroupedNotifications);

    // assert
    expect(res.groups).toHaveLength(2);
    expect(res.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          count: 2,
          kind: {
            $type: `${nsid}#likeGroup`,
            post: post.uri,
            items: expect.arrayContaining([
              { actor: like1.author.did },
              { actor: like2.author.did },
            ]),
          },
        }),
        expect.objectContaining({
          count: 1,
          kind: {
            $type: `${nsid}#repostGroup`,
            post: post.uri,
            items: [{ actor: repost.author.did }],
          },
        }),
      ]),
    );
  });

  test("getGroupedNotifications-3: フィードジェネレーターへのいいねは、フィードジェネレーターごとに1つのグループにまとめる", async () => {
    // arrange
    const { client, notify, viewer } = await setup();
    const generator = await generatorFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.generator")
            .vars({ actor: () => viewer })
            .create(),
      })
      .create();
    await notify({ reason: "like", reasonSubject: generator.uri });
    await notify({ reason: "like", reasonSubject: generator.uri });

    // act
    const res = await client.call(getGroupedNotifications);

    // assert
    expect(res.groups).toMatchObject([
      {
        count: 2,
        kind: { $type: `${nsid}#generatorLikeGroup`, generator: generator.uri },
      },
    ]);
  });

  test("getGroupedNotifications-4: フォローは1つのグループにまとめる", async () => {
    // arrange
    const { client, notify } = await setup();
    await notify({ reason: "follow" });
    await notify({ reason: "follow" });

    // act
    const res = await client.call(getGroupedNotifications);

    // assert
    expect(res.groups).toMatchObject([
      { count: 2, kind: { $type: `${nsid}#followGroup` } },
    ]);
  });

  test("getGroupedNotifications-5: 返信・引用・メンションはまとめずに1件ずつ返す", async () => {
    // arrange
    const { client, notify, viewerPost } = await setup();
    const post = await viewerPost();
    const reply1 = await notify({
      reason: "reply",
      reasonSubject: post.uri,
      sortAt: "2024-01-04T00:00:00.000Z",
    });
    const reply2 = await notify({
      reason: "reply",
      reasonSubject: post.uri,
      sortAt: "2024-01-03T00:00:00.000Z",
    });
    const quote = await notify({
      reason: "quote",
      reasonSubject: post.uri,
      sortAt: "2024-01-02T00:00:00.000Z",
    });
    const mention = await notify({
      reason: "mention",
      sortAt: "2024-01-01T00:00:00.000Z",
    });

    // act
    const res = await client.call(getGroupedNotifications);

    // assert
    expect(res.groups.map((group) => group.kind)).toEqual([
      {
        $type: `${nsid}#replyNotification`,
        post: reply1.uri,
        parent: post.uri,
      },
      {
        $type: `${nsid}#replyNotification`,
        post: reply2.uri,
        parent: post.uri,
      },
      { $type: `${nsid}#quoteNotification`, post: quote.uri },
      { $type: `${nsid}#mentionNotification`, post: mention.uri },
    ]);
  });

  test("getGroupedNotifications-6: relatedViewsに、グループが参照するアクターと投稿とフィードジェネレーターのビューを返す", async () => {
    // arrange
    const { client, notify, viewerPost } = await setup();
    const post = await viewerPost();
    const like = await notify({ reason: "like", reasonSubject: post.uri });

    // act
    const res = await client.call(getGroupedNotifications);

    // assert
    expect(res.relatedViews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: like.author.did,
        }),
        expect.objectContaining({
          $type: "app.bsky.feed.defs#postView",
          uri: post.uri,
        }),
      ]),
    );
  });

  test("getGroupedNotifications-7: グループの中で最新の通知が既読時刻以前なら、グループを既読にする", async () => {
    // arrange
    const { client, notify, viewer } = await setup();
    await notify({ reason: "follow", sortAt: "2024-01-01T00:00:00.000Z" });
    await notify({ reason: "follow", sortAt: "2024-01-02T00:00:00.000Z" });
    await notify({ reason: "mention", sortAt: "2024-01-04T00:00:00.000Z" });
    await ctx.db
      .update(schema.subscriptions)
      .set({ seenAt: new Date("2024-01-03T00:00:00.000Z") })
      .where(eq(schema.subscriptions.actorDid, viewer.did));

    // act
    const res = await client.call(getGroupedNotifications);

    // assert
    expect(res).toMatchObject({
      seenAt: "2024-01-03T00:00:00.000Z",
      groups: [
        { kind: { $type: `${nsid}#mentionNotification` }, isRead: false },
        { kind: { $type: `${nsid}#followGroup` }, isRead: true },
      ],
    });
  });

  test("getGroupedNotifications-8: feedにconversationsを指定すると返信・引用・メンションだけを、followersを指定するとフォローだけを返す", async () => {
    // arrange
    const { client, notify } = await setup();
    await notify({ reason: "follow" });
    await notify({ reason: "mention" });

    // act
    const conversations = await client.call(getGroupedNotifications, {
      feed: "conversations",
    });
    const followers = await client.call(getGroupedNotifications, {
      feed: "followers",
    });

    // assert
    expect(conversations.groups).toMatchObject([
      { kind: { $type: `${nsid}#mentionNotification` } },
    ]);
    expect(followers.groups).toMatchObject([
      { kind: { $type: `${nsid}#followGroup` } },
    ]);
  });

  test("getGroupedNotifications-9: feedにpeople-i-followかactivityを指定すると、空のグループを返す", async () => {
    // arrange
    const { client, notify } = await setup();
    await notify({ reason: "mention" });

    // act
    const peopleIFollow = await client.call(getGroupedNotifications, {
      feed: "people-i-follow",
    });
    const activity = await client.call(getGroupedNotifications, {
      feed: "activity",
    });

    // assert
    expect(peopleIFollow.groups).toEqual([]);
    expect(activity.groups).toEqual([]);
  });
});
