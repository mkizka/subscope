import getLocalTimeline from "@repo/client/me/subsco/server/getLocalTimeline";
import {
  accountFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getLocalTimeline", () => {
  const { ctx } = testSetup;

  type Account = Awaited<
    ReturnType<ReturnType<typeof accountFactory>["create"]>
  >;

  const createMember = () =>
    accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .use((t) => t.withProfile({}))
      .create();

  const createPost = async (
    account: Account,
    createdAt = new Date(),
    replyTo?: { uri: string; cid: string },
  ) => {
    const post = await postFactory(ctx.db)
      .use((t) => (replyTo ? t.asReplyTo(replyTo) : {}))
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => account })
            .create(),
      })
      .props({ createdAt: () => createdAt })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();
    return post;
  };

  test("getLocalTimeline-1: メンバーの投稿とリポストを、新しいものほど上に返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const alice = await createMember();
    const bob = await createMember();
    const recent = await createPost(bob, new Date("2024-01-03T00:00:00Z"));
    const subject = await createPost(bob, new Date("2024-01-01T00:00:00Z"));
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ account: () => alice })
            .create(),
        subject: () => subject,
      })
      .props({ createdAt: () => new Date("2024-01-02T00:00:00Z") })
      .create();
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();

    // act
    const res = await client.call(getLocalTimeline);

    // assert
    expect(res.feed.map((item) => item.post.uri)).toEqual([
      recent.uri,
      subject.uri,
      subject.uri,
    ]);
  });

  test("getLocalTimeline-2: メンバー以外のアカウントの投稿は含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const member = await createMember();
    const outsider = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const memberPost = await createPost(member);
    await createPost(outsider);

    // act
    const res = await client.call(getLocalTimeline);

    // assert
    expect(res.feed.map((item) => item.post.uri)).toEqual([memberPost.uri]);
  });

  test("getLocalTimeline-3: メンバーのリプライは含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const member = await createMember();
    const parent = await createPost(member);
    await createPost(member, new Date(), parent);

    // act
    const res = await client.call(getLocalTimeline);

    // assert
    expect(res.feed.map((item) => item.post.uri)).toEqual([parent.uri]);
  });
});
