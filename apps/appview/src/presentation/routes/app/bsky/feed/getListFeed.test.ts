import { schema } from "@repo/db";
import {
  actorFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getListFeed", () => {
  const { ctx } = testSetup;

  const createPost = async () => {
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create(),
      })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();
    return { actor, post };
  };

  test("getListFeed-1: リストのメンバーとメンバー以外の投稿がある場合、メンバーの投稿のみをfeedViewPostとして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const member = await createPost();
    await createPost();
    const listUri = "at://did:plc:owner/app.bsky.graph.list/1";
    const listItemRecord = await recordFactory(
      ctx.db,
      "app.bsky.graph.listitem",
    ).create();
    await ctx.db.insert(schema.listItems).values({
      uri: listItemRecord.uri,
      cid: listItemRecord.cid,
      actorDid: listItemRecord.actorDid,
      listUri,
      subjectDid: member.actor.did,
      createdAt: new Date(),
      indexedAt: new Date(),
    });

    // act
    const res = await client.app.bsky.feed.getListFeed({ list: listUri });

    // assert
    expect(res.data.feed).toMatchObject([
      { post: { uri: member.post.uri, author: { did: member.actor.did } } },
    ]);
  });
});
