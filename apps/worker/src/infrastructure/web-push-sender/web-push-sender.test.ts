import { createPushReceiver } from "@repo/web-push-mock";
import { afterEach, describe, expect, test } from "vitest";
import webpush from "web-push";

import { WebPushSender } from "./web-push-sender.js";

describe("WebPushSender", () => {
  const vapid = webpush.generateVAPIDKeys();
  const sender = new WebPushSender({
    VAPID_PUBLIC_KEY: vapid.publicKey,
    VAPID_PRIVATE_KEY: vapid.privateKey,
    VAPID_SUBJECT: "mailto:test@example.com",
  });
  const payload = { title: "title", body: "body", tag: "tag" };
  const receivers: Awaited<ReturnType<typeof createPushReceiver>>[] = [];

  const setup = async (status: number) => {
    const receiver = await createPushReceiver({
      status,
      vapidPublicKey: vapid.publicKey,
    });
    receivers.push(receiver);
    return receiver;
  };

  const send = (receiver: Awaited<ReturnType<typeof setup>>) =>
    sender.send(
      {
        endpoint: receiver.subscription.endpoint,
        p256dh: receiver.subscription.keys.p256dh,
        auth: receiver.subscription.keys.auth,
      },
      payload,
    );

  afterEach(() => {
    for (const receiver of receivers.splice(0)) receiver.close();
  });

  test("VAPID署名つきで送り、成功したらsentを返す", async () => {
    const receiver = await setup(201);

    await expect(send(receiver)).resolves.toBe("sent");
    expect(receiver.requests.map((push) => push.json())).toEqual([payload]);
  });

  test.each([404, 410])("%iを返されたらgoneを返す", async (status) => {
    const receiver = await setup(status);

    await expect(send(receiver)).resolves.toBe("gone");
  });

  test("404・410以外のエラーはスローする", async () => {
    const receiver = await setup(500);

    await expect(send(receiver)).rejects.toThrow("500");
  });
});
