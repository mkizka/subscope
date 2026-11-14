import { asAtUriString } from "@atproto/syntax";
import getPostThreadV2 from "@repo/client/app/bsky/unspecced/getPostThreadV2";
import {
  accountFactory,
  postFactory,
  postStatsFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.unspecced.getPostThreadV2", () => {
  const { ctx } = testSetup;

  const setupAuthor = async () => {
    const author = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const createPost = () =>
      postFactory(ctx.db).vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => author })
            .create(),
      });
    const createReply = (
      parent: { uri: string; cid: string },
      root: { uri: string; cid: string },
      index: number,
    ) => {
      const at = new Date(Date.UTC(2026, 0, 1, 0, 0, index));
      return createPost()
        .use((t) => t.asReplyTo(parent, root))
        .props({ createdAt: () => at, indexedAt: () => at });
    };
    return { createPost, createReply };
  };

  const setupThread = async () => {
    const { createPost } = await setupAuthor();
    const root = await createPost().create();
    const anchor = await createPost()
      .use((t) => t.asReplyTo(root))
      .create();
    const reply = await createPost()
      .use((t) => t.asReplyTo(anchor, root))
      .create();
    const nestedReply = await createPost()
      .use((t) => t.asReplyTo(reply, root))
      .create();
    return { root, anchor, reply, nestedReply };
  };

  test("getPostThreadV2-1: 親投稿を負のdepth、アンカー投稿をdepth 0、リプライを正のdepthとして、上から順にthreadに含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const { root, anchor, reply, nestedReply } = await setupThread();

    // act
    const res = await client.call(getPostThreadV2, {
      anchor: asAtUriString(anchor.uri),
    });

    // assert
    expect(res.thread.map(({ uri, depth }) => ({ uri, depth }))).toEqual([
      { uri: root.uri, depth: -1 },
      { uri: anchor.uri, depth: 0 },
      { uri: reply.uri, depth: 1 },
      { uri: nestedReply.uri, depth: 2 },
    ]);
    expect(res.thread[1]?.value).toMatchObject({
      $type: "app.bsky.unspecced.defs#threadItemPost",
      post: { uri: anchor.uri },
    });
  });

  test("getPostThreadV2-2: aboveがfalseのとき、親投稿を含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const { anchor } = await setupThread();

    // act
    const res = await client.call(getPostThreadV2, {
      anchor: asAtUriString(anchor.uri),
      above: false,
      below: 0,
    });

    // assert
    expect(res.thread.map(({ uri, depth }) => ({ uri, depth }))).toEqual([
      { uri: anchor.uri, depth: 0 },
    ]);
  });

  test("getPostThreadV2-3: 存在しない投稿はdepth 0のthreadItemNotFoundとして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const anchor = "at://did:plc:notfound/app.bsky.feed.post/notfound";

    // act
    const res = await client.call(getPostThreadV2, { anchor });

    // assert
    expect(res.thread).toEqual([
      {
        uri: anchor,
        depth: 0,
        value: { $type: "app.bsky.unspecced.defs#threadItemNotFound" },
      },
    ]);
  });

  const setupReplies = async (count: number) => {
    const { createReply, createPost } = await setupAuthor();
    const anchor = await createPost().create();
    const replies = [];
    for (let i = 0; i < count; i++) {
      replies.push(await createReply(anchor, anchor, i).create());
    }
    const [firstReply] = replies;
    if (!firstReply) throw new Error("count must be 1 or more");
    return { createReply, anchor, firstReply, replies };
  };

  test("getPostThreadV2-4: アンカー投稿への直接のリプライは、件数に関わらず全て含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const { anchor, replies } = await setupReplies(25);

    // act
    const res = await client.call(getPostThreadV2, {
      anchor: asAtUriString(anchor.uri),
      branchingFactor: 1,
    });

    // assert
    expect(res.thread.slice(1).map(({ uri }) => uri)).toEqual(
      replies.map(({ uri }) => uri),
    );
  });

  test("getPostThreadV2-5: depth 1より深いリプライは、投稿ごとにbranchingFactor件までを古い順に含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const { createReply, anchor, firstReply } = await setupReplies(1);
    const nested = [];
    for (let i = 0; i < 3; i++) {
      nested.push(await createReply(firstReply, anchor, i).create());
    }

    // act
    const res = await client.call(getPostThreadV2, {
      anchor: asAtUriString(anchor.uri),
      branchingFactor: 2,
    });

    // assert
    expect(res.thread.slice(2).map(({ uri }) => uri)).toEqual(
      nested.slice(0, 2).map(({ uri }) => uri),
    );
  });

  test("getPostThreadV2-6: 各threadItemPostのmoreRepliesに、replyCountから含めたリプライ数を引いた数(0未満は0)を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const { anchor, firstReply } = await setupReplies(2);
    await postStatsFactory(ctx.db)
      .vars({ post: () => Promise.resolve(anchor) })
      .props({ replyCount: () => 5 })
      .create();
    await postStatsFactory(ctx.db)
      .vars({ post: () => Promise.resolve(firstReply) })
      .props({ replyCount: () => 3 })
      .create();

    // act
    const res = await client.call(getPostThreadV2, {
      anchor: asAtUriString(anchor.uri),
      below: 1,
    });

    // assert
    expect(
      res.thread.map(({ value }) =>
        "moreReplies" in value ? value.moreReplies : undefined,
      ),
    ).toEqual([3, 3, 0]);
  });
});
