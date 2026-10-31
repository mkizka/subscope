import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import {
  actorFactory,
  labelFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("ラベラーの指定", () => {
  const { ctx } = testSetup;

  const labelerA = "did:plc:labelera";
  const labelerB = "did:plc:labelerb";

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

  const createLabel = (
    post: { uri: string; actorDid: string },
    src: string,
    val: string,
  ) =>
    labelFactory(ctx.db)
      .props({
        src: () => src,
        uri: () => post.uri,
        actorDid: () => post.actorDid,
        val: () => val,
      })
      .create();

  const fetchPosts = async (uri: string, header?: string) => {
    const { client } = await setupApiTest();
    return client.xrpc(getPosts, {
      params: { uris: [asAtUriString(uri)] },
      headers:
        header === undefined ? {} : { "atproto-accept-labelers": header },
    });
  };

  test("labelers-1: labels には、`atproto-accept-labelers` ヘッダーで指定されたラベラーが付けたラベルだけを含める", async () => {
    // arrange
    const post = await createPost();
    await createLabel(post, labelerA, "spam");
    await createLabel(post, labelerB, "porn");

    // act
    const res = await fetchPosts(post.uri, labelerA);

    // assert
    expect(res.body.posts[0]?.labels?.map((label) => label.src)).toEqual([
      labelerA,
    ]);
  });

  test.each([undefined, "invalid"])(
    "labelers-2: `atproto-accept-labelers` ヘッダーがないか不正な場合は、すべてのラベラーのラベルを labels に含める(%s)",
    async (header) => {
      // arrange
      const post = await createPost();
      await createLabel(post, labelerA, "spam");
      await createLabel(post, labelerB, "porn");

      // act
      const res = await fetchPosts(post.uri, header);

      // assert
      expect(
        res.body.posts[0]?.labels?.map((label) => label.src).sort(),
      ).toEqual([labelerA, labelerB]);
    },
  );

  test("labelers-3: `atproto-accept-labelers` ヘッダーで指定されたラベラーを、応答の `atproto-content-labelers` ヘッダーで返す", async () => {
    // arrange
    const post = await createPost();

    // act
    const res = await fetchPosts(post.uri, `${labelerA};redact, ${labelerB}`);

    // assert
    expect(res.headers.get("atproto-content-labelers")).toBe(
      `${labelerA};redact,${labelerB}`,
    );
  });

  test("labelers-4: テイクダウンは、`atproto-accept-labelers` ヘッダーで指定されていないラベラーのラベルでも適用する", async () => {
    // arrange
    const post = await createPost();
    await createLabel(post, labelerB, "!takedown");

    // act
    const res = await fetchPosts(post.uri, labelerA);

    // assert
    expect(res.body.posts).toEqual([]);
  });
});
