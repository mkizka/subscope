import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getPosts", () => {
  const { ctx } = testSetup;

  const createPost = () =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({
              actor: () =>
                actorFactory(ctx.db)
                  .use((t) => t.withProfile({}))
                  .create(),
            })
            .create(),
      })
      .create();

  test("getPosts-1: 指定したURIの順に投稿を返し、存在しない投稿は除外する", async () => {
    // arrange
    const { client } = await setupApiTest();
    const first = await createPost();
    const second = await createPost();

    // act
    const res = await client.app.bsky.feed.getPosts({
      uris: [
        second.uri,
        "at://did:plc:notfound/app.bsky.feed.post/notfound",
        first.uri,
      ],
    });

    // assert
    expect(res.data.posts.map((post) => post.uri)).toEqual([
      second.uri,
      first.uri,
    ]);
  });
});
