import { runInThisContext } from "node:vm";

import { afterEach, describe, expect, test, vi } from "vitest";
import webpush from "web-push";

import {
  createPushReceiver,
  installPushManagerMock,
  pushManagerMockScript,
} from "./index.js";

const vapid = webpush.generateVAPIDKeys();
const vapidDetails = {
  subject: "mailto:test@example.com",
  ...vapid,
};

const receivers: Awaited<ReturnType<typeof createPushReceiver>>[] = [];
const start = async (...args: Parameters<typeof createPushReceiver>) => {
  const receiver = await createPushReceiver(...args);
  receivers.push(receiver);
  return receiver;
};

// web-push's own sender only speaks https, so build the request and fetch it
const send = async (
  subscription: webpush.PushSubscription,
  payload: string,
  details: webpush.VapidKeys & { subject: string } = vapidDetails,
) => {
  const request = webpush.generateRequestDetails(subscription, payload, {
    vapidDetails: details,
  });
  return fetch(request.endpoint, {
    method: request.method,
    headers: request.headers,
    body: new Uint8Array(request.body),
  });
};

afterEach(() => {
  receivers.splice(0).forEach((receiver) => receiver.close());
  vi.unstubAllGlobals();
});

describe("createPushReceiver", () => {
  test("decrypts a payload sent by web-push", async () => {
    const receiver = await start();

    const response = await send(
      receiver.subscription,
      JSON.stringify({ title: "hello" }),
    );

    expect(response.status).toBe(201);
    expect(receiver.requests).toHaveLength(1);
    expect(receiver.requests[0]?.json()).toEqual({ title: "hello" });
    expect(receiver.requests[0]?.headers["content-encoding"]).toBe("aes128gcm");
  });

  test("decrypts a non-ASCII payload", async () => {
    const receiver = await start();

    await send(receiver.subscription, "日本語の通知🔔");

    expect(receiver.requests[0]?.text).toBe("日本語の通知🔔");
  });

  test("responds with the configured status", async () => {
    const receiver = await start({ status: 410 });

    expect((await send(receiver.subscription, "gone")).status).toBe(410);
    expect(receiver.requests).toEqual([]);

    receiver.status = 201;
    await send(receiver.subscription, "ok");
    expect(receiver.requests).toHaveLength(1);
  });

  test("accepts a valid VAPID signature", async () => {
    const receiver = await start({ vapidPublicKey: vapid.publicKey });

    await send(receiver.subscription, "signed");

    expect(receiver.requests).toHaveLength(1);
  });

  test("rejects a VAPID signature from another key", async () => {
    const receiver = await start({ vapidPublicKey: vapid.publicKey });

    const response = await send(receiver.subscription, "forged", {
      subject: vapidDetails.subject,
      ...webpush.generateVAPIDKeys(),
    });

    expect(response.status).toBe(401);
  });

  test("responds 400 to a payload it cannot decrypt", async () => {
    const receiver = await start();

    const response = await fetch(receiver.subscription.endpoint, {
      method: "POST",
      body: Buffer.alloc(100),
    });

    expect(response.status).toBe(400);
  });
});

describe("installPushManagerMock", () => {
  const subscription = {
    endpoint: "https://push.example/abc",
    keys: { p256dh: "p", auth: "a" },
  };

  const stubBrowser = (localStorage: unknown) => {
    class PushManager {
      subscribe(): Promise<{
        toJSON: () => unknown;
        unsubscribe: () => Promise<boolean>;
      }> {
        throw new Error("not installed");
      }
      getSubscription(): Promise<unknown> {
        throw new Error("not installed");
      }
    }
    vi.stubGlobal("PushManager", PushManager);
    vi.stubGlobal("localStorage", localStorage);
    return new PushManager();
  };

  const storage = () => {
    const map = new Map<string, string>();
    return {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
      removeItem: (key: string) => void map.delete(key),
    };
  };

  test("subscribes, reports and unsubscribes", async () => {
    const manager = stubBrowser(storage());
    installPushManagerMock(subscription);

    expect(await manager.getSubscription()).toBeNull();
    const subscribed = await manager.subscribe();
    expect(subscribed.toJSON()).toMatchObject(subscription);
    expect(await manager.getSubscription()).not.toBeNull();
    expect(await subscribed.unsubscribe()).toBe(true);
    expect(await manager.getSubscription()).toBeNull();
  });

  test("keeps state in memory when localStorage throws", async () => {
    const broken = () => {
      throw new Error("denied");
    };
    const manager = stubBrowser({
      getItem: broken,
      setItem: broken,
      removeItem: broken,
    });
    installPushManagerMock(subscription);

    await manager.subscribe();
    expect(await manager.getSubscription()).not.toBeNull();
  });

  test("works when serialized as a script", async () => {
    const manager = stubBrowser(storage());

    runInThisContext(pushManagerMockScript(subscription));

    await manager.subscribe();
    expect(await manager.getSubscription()).not.toBeNull();
  });
});
