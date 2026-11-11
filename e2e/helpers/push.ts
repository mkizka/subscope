import {
  createDecipheriv,
  createECDH,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { createServer } from "node:http";

import type { Browser } from "@playwright/test";

export type PushMessage = { title: string; body: string; tag: string };

const readBody = async (request: AsyncIterable<Buffer>) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
};

// RFC 8291(aes128gcm)の復号
const decrypt = (
  body: Buffer,
  keys: { ecdh: ReturnType<typeof createECDH>; auth: Buffer },
): PushMessage => {
  const salt = body.subarray(0, 16);
  const idLength = body.readUInt8(20);
  const serverPublicKey = body.subarray(21, 21 + idLength);
  const encrypted = body.subarray(21 + idLength);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0"),
    keys.ecdh.getPublicKey(),
    serverPublicKey,
  ]);
  const ikm = Buffer.from(
    hkdfSync(
      "sha256",
      keys.ecdh.computeSecret(serverPublicKey),
      keys.auth,
      keyInfo,
      32,
    ),
  );
  const derive = (info: string, length: number) =>
    Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from(info), length));
  const decipher = createDecipheriv(
    "aes-128-gcm",
    derive("Content-Encoding: aes128gcm\0", 16),
    derive("Content-Encoding: nonce\0", 12),
  );
  decipher.setAuthTag(encrypted.subarray(-16));
  const padded = Buffer.concat([
    decipher.update(encrypted.subarray(0, -16)),
    decipher.final(),
  ]);
  const plain = padded.subarray(0, padded.lastIndexOf(2)).toString();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return JSON.parse(plain) as PushMessage;
};

const createPushReceiver = async () => {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = randomBytes(16);
  const messages: PushMessage[] = [];
  const server = createServer((request, response) => {
    void readBody(request).then((body) => {
      messages.push(decrypt(body, { ecdh, auth }));
      response.writeHead(201).end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address !== "object" || !address) throw new Error("no address");
  return {
    messages,
    subscription: {
      endpoint: `http://127.0.0.1:${address.port}/push`,
      p256dh: ecdh.getPublicKey().toString("base64url"),
      auth: auth.toString("base64url"),
    },
    close: () => server.close(),
  };
};

// 本物のプッシュサーバーは使えないので、ブラウザの購読を、テスト内の受け口へ向いた購読に差し替える
export const openDevice = async (
  browser: Browser,
  options: { baseURL: string; storageState: string },
) => {
  const receiver = await createPushReceiver();
  const context = await browser.newContext(options);
  await context.grantPermissions(["notifications"]);
  await context.addInitScript(({ endpoint, p256dh, auth }) => {
    const key = "mockPushSubscribed";
    const subscription = {
      endpoint,
      toJSON: () => ({ endpoint, keys: { p256dh, auth } }),
      unsubscribe: () => {
        localStorage.removeItem(key);
        return Promise.resolve(true);
      },
    };
    Object.assign(PushManager.prototype, {
      subscribe: () => {
        localStorage.setItem(key, "1");
        return Promise.resolve(subscription);
      },
      getSubscription: () =>
        Promise.resolve(localStorage.getItem(key) ? subscription : null),
    });
  }, receiver.subscription);
  return { context, page: await context.newPage(), receiver };
};
