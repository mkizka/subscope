import assert from "node:assert";
import { once } from "node:events";

import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import express from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import { testRegistry, type TestServices } from "../../shared/test-utils.js";

describe("lexRouter", () => {
  let services: TestServices;
  let server: ReturnType<express.Express["listen"]>;
  let baseUrl: string;

  beforeAll(async () => {
    services = await testRegistry.resolve();
    const app = express();
    app.use(services.lexRouter);
    server = app.listen(0);
    await once(server, "listening");
    const address = server.address();
    assert(typeof address === "object" && address);
    baseUrl = `http://localhost:${address.port}/xrpc`;
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    services.tokenVerifier.setVerifyResult({ did: asDid("did:plc:alice") });
  });

  const auth = { authorization: "Bearer token" };

  test("認証がない場合、401エラーを返す", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.sync.getSubscriptionStatus`);

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: "AuthenticationRequired",
      message: "Authentication required",
    });
  });

  test("getSubscriptionStatusはlexiconに沿ったレスポンスを返す", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.sync.getSubscriptionStatus`, {
      headers: auth,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#notSubscribed",
      isSubscriber: false,
    });
  });

  test("subscribeServerのユースケースエラーはエラー名を持つ400エラーになる", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.sync.subscribeServer`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ inviteCode: "invalid" }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "InvalidInviteCode",
      message: "Invalid invite code",
    });
  });

  test("unsubscribeServerのユースケースエラーはエラー名を持つ400エラーになる", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.sync.unsubscribeServer`, {
      method: "POST",
      headers: auth,
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "NotSubscribed" });
  });

  test("getUnreadCountは未読数を返す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.notification.getUnreadCount`, {
      headers: auth,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 0 });
  });

  test("updateSeenは200を返す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.notification.updateSeen`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ seenAt: new Date().toISOString() }),
    });

    expect(res.status).toBe(200);
  });

  test("管理者でない場合、admin APIは403エラーを返す", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.admin.getInviteCodes`, {
      headers: auth,
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: "Forbidden",
      message: "Admin access required",
    });
  });

  test("registerAdminのユースケースエラーはエラー名を持つ400エラーになる", async () => {
    services.actorRepository.add(actorFactory({ isAdmin: true }));

    const res = await fetch(`${baseUrl}/me.subsco.admin.registerAdmin`, {
      method: "POST",
      headers: auth,
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "AdminAlreadyExists" });
  });

  test("getListは存在しないリストに400エラーを返す", async () => {
    const res = await fetch(
      `${baseUrl}/app.bsky.graph.getList?list=at://did:plc:alice/app.bsky.graph.list/notfound`,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "InvalidRequest",
      message: "List not found",
    });
  });

  test("getPostThreadは存在しない投稿に400エラーを返す", async () => {
    const res = await fetch(
      `${baseUrl}/app.bsky.feed.getPostThread?uri=at://did:plc:alice/app.bsky.feed.post/notfound`,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "NotFound",
      message: "Post not found: at://did:plc:alice/app.bsky.feed.post/notfound",
    });
  });

  test("getPreferencesは固定のフィード設定を返す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.actor.getPreferences`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      preferences: [
        {
          $type: "app.bsky.actor.defs#savedFeedsPrefV2",
          items: [
            {
              id: "3ksog462gr22d",
              type: "timeline",
              value: "following",
              pinned: true,
            },
          ],
        },
      ],
    });
  });

  test("searchPostsは空白のみのクエリに空の結果を返す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.feed.searchPosts?q=%20`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ posts: [] });
  });

  test("getLikesはlexiconに沿ったレスポンスを返す", async () => {
    const uri = "at://did:plc:bob/app.bsky.feed.post/123";
    const res = await fetch(
      `${baseUrl}/app.bsky.feed.getLikes?uri=${encodeURIComponent(uri)}`,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ uri, likes: [] });
  });

  test("getPostsは存在しない投稿を除いて返す", async () => {
    const uri = "at://did:plc:bob/app.bsky.feed.post/123";
    const res = await fetch(
      `${baseUrl}/app.bsky.feed.getPosts?uris=${encodeURIComponent(uri)}`,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ posts: [] });
  });

  test("getFeedGeneratorsは存在しないフィードを除いて返す", async () => {
    const uri = "at://did:plc:bob/app.bsky.feed.generator/123";
    const res = await fetch(
      `${baseUrl}/app.bsky.feed.getFeedGenerators?feeds=${encodeURIComponent(uri)}`,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ feeds: [] });
  });

  test("getRepostedByはパラメータが不正な場合400エラーを返す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.feed.getRepostedBy`);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "InvalidRequest" });
  });

  test("未実装のNSIDは501エラーを返す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.feed.getQuotes`);

    expect(res.status).toBe(501);
    expect(await res.json()).toMatchObject({ error: "MethodNotImplemented" });
  });
});
