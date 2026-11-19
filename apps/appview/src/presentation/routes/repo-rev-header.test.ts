import { asDid } from "@atproto/did";
import { type Client, XrpcResponseError } from "@atproto/lex";
import { asAtUriString } from "@atproto/syntax";
import getProfile from "@repo/client/app/bsky/actor/getProfile";
import getProfiles from "@repo/client/app/bsky/actor/getProfiles";
import getActorLikes from "@repo/client/app/bsky/feed/getActorLikes";
import getAuthorFeed from "@repo/client/app/bsky/feed/getAuthorFeed";
import getListFeed from "@repo/client/app/bsky/feed/getListFeed";
import getPostThread from "@repo/client/app/bsky/feed/getPostThread";
import getTimeline from "@repo/client/app/bsky/feed/getTimeline";
import {
  accountFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { assert, describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("atproto-repo-revヘッダー", () => {
  const { ctx } = testSetup;

  type Account = Awaited<
    ReturnType<ReturnType<typeof accountFactory>["create"]>
  >;

  const requests: Record<
    string,
    (client: Client, viewer: Account) => Promise<{ headers: Headers }>
  > = {
    getProfile: (client, { did }) =>
      client.xrpc(getProfile, { params: { actor: asDid(did) } }),
    getProfiles: (client, { did }) =>
      client.xrpc(getProfiles, { params: { actors: [asDid(did)] } }),
    getTimeline: (client) => client.xrpc(getTimeline, { params: {} }),
    getListFeed: (client, { did }) =>
      client.xrpc(getListFeed, {
        params: { list: asAtUriString(`at://${did}/app.bsky.graph.list/1`) },
      }),
    getPostThread: async (client, viewer) => {
      const post = await postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ account: () => viewer })
              .create(),
        })
        .create();
      return client.xrpc(getPostThread, {
        params: { uri: asAtUriString(post.uri) },
      });
    },
    getAuthorFeed: (client, { did }) =>
      client.xrpc(getAuthorFeed, { params: { actor: asDid(did) } }),
    getActorLikes: (client, { did }) =>
      client.xrpc(getActorLikes, { params: { actor: asDid(did) } }),
  };

  const setupViewer = async (rev: string | null) => {
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .props({ rev: () => rev })
      .create();
    loginAs(viewer.did);
    return { client, viewer };
  };

  test.each(Object.entries(requests))(
    "repoRevHeader-1: ログイン中なら、本人のrevを応答のatproto-repo-revヘッダーで返す(%s)",
    async (_, request) => {
      // arrange
      const { client, viewer } = await setupViewer("3kabc");

      // act
      const res = await request(client, viewer);

      // assert
      expect(res.headers.get("atproto-repo-rev")).toBe("3kabc");
    },
  );

  test("repoRevHeader-2: revを記録していないときは、ヘッダーを付けない", async () => {
    // arrange
    const { client } = await setupViewer(null);

    // act
    const res = await client.xrpc(getTimeline, { params: {} });

    // assert
    expect(res.headers.get("atproto-repo-rev")).toBeNull();
  });

  test("repoRevHeader-3: getPostThreadは、投稿が見つからないエラーでもヘッダーを返す", async () => {
    // arrange
    const { client } = await setupViewer("3kabc");

    // act
    const error = await client
      .xrpc(getPostThread, {
        params: { uri: "at://did:plc:notfound/app.bsky.feed.post/notfound" },
      })
      .catch((e: unknown) => e);

    // assert
    assert(error instanceof XrpcResponseError);
    expect(error.response.headers.get("atproto-repo-rev")).toBe("3kabc");
  });
});
