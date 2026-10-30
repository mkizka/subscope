import { asAtUriString } from "@atproto/syntax";
import getPostThreadV2 from "@repo/client/lex/app/bsky/unspecced/getPostThreadV2";
import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.unspecced.getPostThreadV2", () => {
  const { ctx } = testSetup;

  const setupThread = async () => {
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const createPost = () =>
      postFactory(ctx.db).vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => author })
            .create(),
      });
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

  test("getPostThreadV2-3: 存在しない投稿は、depth 0のthreadItemNotFoundとして返す", async () => {
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
});
