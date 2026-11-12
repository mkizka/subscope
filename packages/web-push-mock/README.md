# @repo/web-push-mock

A fake Web Push service for end-to-end tests. Real push services cannot be
used in CI, and headless browsers cannot subscribe to them. This package gives
you two pieces that replace them:

- **`createPushReceiver`** (Node): a local HTTP server that acts as the push
  service. It receives what your backend sends, decrypts the RFC 8291
  (`aes128gcm`) payload, and records it. Optionally it verifies the VAPID
  signature (RFC 8292) and answers with any status you choose, such as `410`
  for an expired subscription.
- **`installPushManagerMock`** (browser): replaces `PushManager.subscribe` and
  `getSubscription` so your page "subscribes" to the receiver instead of a real
  push service.

It has no dependency on Playwright, Puppeteer, or any test framework.

## Usage with Playwright

```ts
import {
  createPushReceiver,
  installPushManagerMock,
} from "@repo/web-push-mock";

const receiver = await createPushReceiver();

const context = await browser.newContext();
await context.grantPermissions(["notifications"]);
await context.addInitScript(installPushManagerMock, receiver.subscription);

// ...click "enable notifications" in the page, trigger a push on your backend...

expect(receiver.requests[0]?.json()).toMatchObject({ title: "Hello" });
receiver.close();
```

For drivers that take a script string, use `pushManagerMockScript(subscription)`.

## API

### `createPushReceiver(options?)`

- `options.status`: initial response status. Default `201`.
- `options.vapidPublicKey`: base64url public key. When set, requests whose
  `Authorization: vapid t=..., k=...` header is missing, expired, or not signed
  by this key get `401`.

Returns:

- `subscription`: `{ endpoint, keys: { p256dh, auth } }`, the standard
  `PushSubscriptionJSON` shape. Pass it to your backend as the subscription.
- `requests`: received pushes, each `{ headers, body, text, json() }`.
- `status`: assign it to change the response status. Requests answered with
  `4xx`/`5xx` are not recorded, so `410` simulates an expired subscription.
- `close()`: stops the server.

A payload that cannot be decrypted is answered with `400`.

### `installPushManagerMock(subscription, storageKey?)`

Must run in the page, before your code. It is self-contained (no outer-scope
references), so it can be serialized by any driver. The subscribed state is kept
in `localStorage` under `storageKey` (default `mockPushSubscribed`) and falls
back to memory when storage is unavailable. It also makes
`PushManager.permissionState` return `"granted"`.

## Limits

- The payload must fit in a single `aes128gcm` record (up to 4096 bytes, the
  Web Push maximum).
- The receiver listens on `127.0.0.1` over plain HTTP; your backend must allow
  such an endpoint.
- The mock does not run a Service Worker `push` event. It tests what your
  backend sends and how your page subscribes, not how the browser displays it.
- Only the `PushManager` methods above are replaced.
