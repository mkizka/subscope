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
    app.use((_req, res) => {
      res.status(418).end();
    });
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

  test("認証がない場合、xrpc-serverと同じ401エラーを返す", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.sync.getSubscriptionStatus`);

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: "AuthenticationRequired",
      message: "Bad authorization header",
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

  test("管理者でない場合、admin APIは401エラーを返す", async () => {
    const res = await fetch(`${baseUrl}/me.subsco.admin.getInviteCodes`, {
      headers: auth,
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: "AuthenticationRequired",
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

  test("LexRouterにないNSIDは次のルーターへ流す", async () => {
    const res = await fetch(`${baseUrl}/app.bsky.actor.getProfile`);

    expect(res.status).toBe(418);
  });
});
