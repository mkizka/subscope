import { expect, test as base } from "@playwright/test";

import { createRecord, follow, putRecord } from "../../helpers/pds";
import { openDevice } from "../../helpers/push";

type Device = Awaited<ReturnType<typeof openDevice>>;

const test = base.extend<{ newDevice: () => Promise<Device> }>({
  newDevice: async ({ browser }, use, testInfo) => {
    const { baseURL, storageState } = testInfo.project.use;
    const devices: Device[] = [];
    await use(async () => {
      const device = await openDevice(browser, {
        baseURL: baseURL ?? "",
        storageState: typeof storageState === "string" ? storageState : "",
      });
      devices.push(device);
      return device;
    });
    for (const { context, receiver } of devices) {
      await context.close();
      receiver.close();
    }
  },
});

const turnOn = async ({ page }: Device) => {
  await page.goto("/notifications");
  await page.getByRole("button", { name: "オンにする" }).click();
  await expect(page.getByRole("button", { name: "オフにする" })).toBeVisible();
};

const likeAlicePost = async (text: string) => {
  const createdAt = new Date().toISOString();
  const post = await createRecord("alice.test", "app.bsky.feed.post", {
    text,
    createdAt,
  });
  await putRecord("bob.test", "app.bsky.actor.profile", "self", {
    displayName: "Bob",
  });
  await follow("alice.test", "bob.test");
  await createRecord("bob.test", "app.bsky.feed.like", {
    subject: { uri: post.uri, cid: post.cid },
    createdAt,
  });
};

test.describe("プッシュ通知", () => {
  test("pushSetting-e1: 「オンにする」を押すと、通知が追加されたときにその端末へプッシュ通知を送る", async ({
    newDevice,
  }) => {
    const device = await newDevice();
    await turnOn(device);
    const text = `pushSetting-e1: ${new Date().toISOString()}`;

    await likeAlicePost(text);

    await expect
      .poll(() => device.receiver.requests.map((push) => push.json()), {
        timeout: 30_000,
      })
      .toMatchObject([{ title: "Bobさんがいいねしました", body: text }]);
  });

  test("pushSetting-e2: 「オフにする」を押すと、その端末へプッシュ通知を送らない", async ({
    newDevice,
  }) => {
    const turnedOff = await newDevice();
    const other = await newDevice();
    await turnOn(turnedOff);
    await turnOn(other);
    await turnedOff.page.getByRole("button", { name: "オフにする" }).click();
    await expect(
      turnedOff.page.getByRole("button", { name: "オンにする" }),
    ).toBeVisible();

    await likeAlicePost(`pushSetting-e2: ${new Date().toISOString()}`);

    await expect
      .poll(() => other.receiver.requests.length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    expect(turnedOff.receiver.requests).toEqual([]);
  });

  test("pushSetting-e3: ログアウトすると、その端末へプッシュ通知を送らない", async ({
    newDevice,
  }) => {
    const loggedOut = await newDevice();
    const other = await newDevice();
    await turnOn(loggedOut);
    await turnOn(other);
    await loggedOut.page.goto("/settings");
    await loggedOut.page.getByRole("button", { name: "ログアウト" }).click();
    await expect(loggedOut.page).toHaveURL("/login");

    await likeAlicePost(`pushSetting-e3: ${new Date().toISOString()}`);

    await expect
      .poll(() => other.receiver.requests.length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    expect(loggedOut.receiver.requests).toEqual([]);
  });
});
