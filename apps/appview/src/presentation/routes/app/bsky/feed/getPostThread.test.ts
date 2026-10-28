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
});
