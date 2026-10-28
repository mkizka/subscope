import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getPostThread", () => {
  const { ctx } = testSetup;

  test("getPostThread-1: 親投稿とリプライがある投稿を指定した場合、それらを含むthreadViewPostを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
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
    const target = await createPost()
      .use((t) => t.asReplyTo(root))
      .create();
    const reply = await createPost()
      .use((t) => t.asReplyTo(target, root))
      .create();

    // act
    const res = await client.app.bsky.feed.getPostThread({ uri: target.uri });

    // assert
    expect(res.data.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: { uri: target.uri },
      parent: { post: { uri: root.uri } },
      replies: [{ post: { uri: reply.uri } }],
    });
  });

  test("getPostThread-2: 存在しない投稿を指定した場合、400 NotFoundを返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.app.bsky.feed.getPostThread({
      uri: "at://did:plc:notfound/app.bsky.feed.post/notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "NotFound",
    });
  });
});
