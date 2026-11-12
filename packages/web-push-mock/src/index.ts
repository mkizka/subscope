import {
  createDecipheriv,
  createECDH,
  createPublicKey,
  createVerify,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { createServer } from "node:http";

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type ReceivedPush = {
  headers: IncomingHttpHeaders;
  body: Buffer;
  text: string;
  json: () => Record<string, unknown>;
};

export type PushReceiverOptions = {
  status?: number;
  vapidPublicKey?: string;
};

const parseJson = (text: string): { exp?: number } & Record<string, unknown> =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  JSON.parse(text) as never;

const readBody = async (request: AsyncIterable<Buffer>) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const decrypt = (
  body: Buffer,
  keys: { ecdh: ReturnType<typeof createECDH>; auth: Buffer },
) => {
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
  let end = padded.length;
  while (end > 0 && padded[end - 1] === 0) end--;
  return padded.subarray(0, end - 1);
};

const verifyVapid = (authorization: string | undefined, publicKey: string) => {
  const token = /\bt=([\w-]+)\.([\w-]+)\.([\w-]+)/.exec(authorization ?? "");
  const key = /\bk=([\w-]+)/.exec(authorization ?? "");
  if (!token || key?.[1] !== publicKey) return false;
  const [, header, payload, signature] = token;
  const claims = parseJson(Buffer.from(payload ?? "", "base64url").toString());
  if (!claims.exp || claims.exp * 1000 < Date.now()) return false;
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: Buffer.from(publicKey, "base64url")
      .subarray(1, 33)
      .toString("base64url"),
    y: Buffer.from(publicKey, "base64url").subarray(33).toString("base64url"),
  };
  return createVerify("sha256")
    .update(`${header}.${payload}`)
    .verify(
      {
        key: createPublicKey({ key: jwk, format: "jwk" }),
        dsaEncoding: "ieee-p1363",
      },
      Buffer.from(signature ?? "", "base64url"),
    );
};

export const createPushReceiver = async (options: PushReceiverOptions = {}) => {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = randomBytes(16);
  const requests: ReceivedPush[] = [];
  const receiver = {
    status: options.status ?? 201,
    requests,
    subscription: {
      endpoint: "",
      keys: {
        p256dh: ecdh.getPublicKey().toString("base64url"),
        auth: auth.toString("base64url"),
      },
    } satisfies PushSubscriptionData,
    close: () => server.close(),
  };
  const server = createServer((request, response) => {
    void readBody(request).then((raw) => {
      if (
        options.vapidPublicKey &&
        !verifyVapid(request.headers.authorization, options.vapidPublicKey)
      ) {
        response.writeHead(401).end();
        return;
      }
      if (receiver.status >= 400) {
        response.writeHead(receiver.status).end();
        return;
      }
      try {
        const body = decrypt(raw, { ecdh, auth });
        const text = body.toString();
        requests.push({
          headers: request.headers,
          body,
          text,
          json: () => parseJson(text),
        });
        response.writeHead(receiver.status).end();
      } catch {
        response.writeHead(400).end();
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address !== "object" || !address) throw new Error("no address");
  receiver.subscription.endpoint = `http://127.0.0.1:${address.port}/push`;
  return receiver;
};

// Must stay self-contained: it is serialized and run inside the page.
export const installPushManagerMock = (
  subscription: PushSubscriptionData,
  storageKey = "mockPushSubscribed",
) => {
  let memory = false;
  const read = () => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return memory;
    }
  };
  const write = (value: boolean) => {
    memory = value;
    try {
      if (value) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      // in-memory fallback
    }
  };
  const mock = {
    endpoint: subscription.endpoint,
    expirationTime: null,
    toJSON: () => ({
      endpoint: subscription.endpoint,
      expirationTime: null,
      keys: subscription.keys,
    }),
    unsubscribe: () => {
      write(false);
      return Promise.resolve(true);
    },
  };
  Object.assign(PushManager.prototype, {
    subscribe: () => {
      write(true);
      return Promise.resolve(mock);
    },
    getSubscription: () => Promise.resolve(read() ? mock : null),
    permissionState: () => Promise.resolve("granted"),
  });
};

// For drivers that take a script string instead of a function.
export const pushManagerMockScript = (
  subscription: PushSubscriptionData,
  storageKey?: string,
) =>
  `(${installPushManagerMock.toString()})(${JSON.stringify(subscription)}, ${JSON.stringify(storageKey)})`;
