# プッシュ通知

通知が追加されたときに、Subscopeのwebクライアントへ Web Push(VAPID)でプッシュ通知を送る。外部サービスは使わず、workerがブラウザのプッシュサーバーへ直接送る。

このファイルは実装前の設計書。実装するPRで、下の「仕様」を docs/specs に移し、テストと実装を同じPRに入れる。すべて実装したら、このファイルは消す。

## 方針

- 対象はSubscopeのwebクライアントだけにする。公式アプリのプッシュはBlueskyのAPNs/FCMの鍵で送られ、PDSは `app.bsky.notification.registerPush` を本文の `serviceDid` へ転送するので、Subscopeからは送れない。`registerPush` は実装しない
- 通知の6種類(like、repost、follow、reply、quote、mention)をすべて送る。種類ごとのオン/オフは作らない
- 端末ごとにオプトインする。通知ページの切り替えを本人が押したときだけ、ブラウザに許可を求めて購読する
- 本文に相手の名前と投稿の本文を入れる。Web Pushの本文は端末の鍵で暗号化されるので、プッシュサーバーには読まれない
- VAPID鍵を設定していないサーバーでは、プッシュ通知の機能を出さない。セルフホストで鍵の設定を必須にしないため

## 全体の流れ

```
[web] 通知ページで「オンにする」
  → ブラウザが /sw.js を登録し、PushManager.subscribe で購読を作る
  → POST /api/push-subscription で購読を push_subscriptions に保存
[worker] Tapからliveのレコードを受け取り、通知を新しく保存する
  → コミット後に sendPushNotification ジョブを積む
  → ジョブが購読を読み、web-push で暗号化してプッシュサーバーへ送る
[ブラウザ] /sw.js が push を受けて通知を出し、タップで /notifications を開く
```

## 仕様

### docs/specs/worker.md に追加する節

「通知の生成」の節の後に置く。

```md
## プッシュ通知の送信

通知を作ったときに、受け取るメンバーが登録した端末へ Web Push でプッシュ通知を送る。タイトルは通知ページと同じ文にし、相手の名前は表示名、なければハンドル、それもなければDIDにする。

| reason  | タイトル                       | 本文             |
| ------- | ------------------------------ | ---------------- |
| like    | {名前}さんがいいねしました     | 対象の投稿の本文 |
| repost  | {名前}さんがリポストしました   | 対象の投稿の本文 |
| follow  | {名前}さんにフォローされました | 空               |
| reply   | {名前}さんが返信しました       | その投稿の本文   |
| quote   | {名前}さんが引用しました       | その投稿の本文   |
| mention | {名前}さんがメンションしました | その投稿の本文   |

対象の投稿を保存していないときは、本文を空にする。

- push-1: 通知を作ると、受け取るメンバーが登録したすべての端末にプッシュ通知を送る
- push-2: Tapからリアルタイムに受け取ったレコードの通知だけを送り、バックフィルで受け取ったレコードや、取得しに行ったレコードの通知は送らない
- push-3: 作成日時が10分より前の通知は送らない
- push-4: すでに保存していた通知は、レコードの更新や再受信で作り直しても送らない
- push-5: 送る前に取り消された通知は送らない
- push-6: タイトルと本文を、通知の種類に合わせて上の表のとおりにする
- push-7: いいねとリポストは、同じ投稿への同じ種類の通知が端末上で1件にまとまるようにする
- push-8: プッシュサーバーが404か410を返した端末の登録を削除する
```

push-3は、workerが止まっていた間にTapが溜めたイベントをまとめて受け取ったときに、古い通知が大量に届くのを防ぐため。

### docs/specs/web-client.md

「PWA」の節の説明文を次に変える。

```md
ブラウザやOSのホーム画面にアプリとしてインストールできるようにする。Service Workerはプッシュ通知のためだけに使い、オフライン動作には対応しない。
```

「通知」の節の後に、次の節を追加する。

```md
## プッシュ通知

通知ページ(`/notifications`)の見出し「通知」の下に、この端末でプッシュ通知を受け取るかの切り替えを1行で表示する。切り替えは端末ごとで、アカウントの設定ではない。プッシュ通知をタップすると `/notifications` を開く。サーバーにVAPID鍵が設定されていないときは、この行を表示しない。

- pushSetting-e1: 「オンにする」を押すと、通知が追加されたときにその端末へプッシュ通知を送る
- pushSetting-e2: 「オフにする」を押すと、その端末へプッシュ通知を送らない
- pushSetting-e3: ログアウトすると、その端末へプッシュ通知を送らない
- pushSetting-s1: 受け取らない設定のときは「プッシュ通知はオフです」と「オンにする」ボタンを表示する
- pushSetting-s2: 受け取る設定のときは「プッシュ通知はオンです」と「オフにする」ボタンを表示する
- pushSetting-s3: ブラウザで通知をブロックしているときは、ボタンを出さず「ブラウザで通知がブロックされています。ブラウザの設定から許可してください」と表示する
- pushSetting-s4: プッシュ通知に対応していないブラウザでは、ボタンを出さず「このブラウザはプッシュ通知に対応していません。iPhoneとiPadではホーム画面に追加すると使えます」と表示する
- pushSetting-s5: 切り替えている間は、ボタンを押せなくしてスピナーを表示する
```

## 実装

### PRの分け方

1. DBとworker: テーブル、環境変数、ジョブ、送信。worker.md の仕様とテスト
2. web: 環境変数、API、Service Worker、切り替えのUI、ログアウト。web-client.md の仕様、E2E、story、VRTのスナップショット

1をマージしてから2に取りかかる。1だけをデプロイしても購読が0件なので、何も送らない。

### DB(PR1)

`packages/db/src/schema.ts` に追加し、`pnpm --filter @repo/db db:generate` でマイグレーションを作る。

```ts
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    endpoint: text().primaryKey(),
    accountDid: varchar({ length: 256 })
      .notNull()
      .references(() => accounts.did, { onDelete: "cascade" }),
    p256dh: varchar({ length: 256 }).notNull(),
    auth: varchar({ length: 256 }).notNull(),
    createdAt: timestamp().notNull(),
  },
  (table) => [index("push_subscriptions_account_idx").on(table.accountDid)],
);
```

- 主キーは `endpoint`。同じ端末で別のアカウントがオンにしたら、`accountDid` と鍵を上書きする(最後にオンにしたアカウントの通知だけが届く)
- 1アカウントあたりの端末数に上限は設けない

### 環境変数

鍵は `npx web-push generate-vapid-keys` で作る。開発用の既定値は一度だけ作ってコミットする(webとworkerで同じ公開鍵にする)。本番では任意にし、未設定なら機能を出さない。

| 変数                | 使う場所    | 本番 | 開発の既定値             |
| ------------------- | ----------- | ---- | ------------------------ |
| `VAPID_PUBLIC_KEY`  | web, worker | 任意 | 生成してコミット         |
| `VAPID_PRIVATE_KEY` | worker      | 任意 | 生成してコミット         |
| `VAPID_SUBJECT`     | worker      | 任意 | `mailto:dev@example.com` |

- web: `apps/web/app/server/env.ts` に `VAPID_PUBLIC_KEY` を `ADMIN_API_TOKEN` と同じ `match` の書き方で足す
- worker: `apps/worker/src/shared/env.ts` に3つ足す。workerの `match` は `NODE_ENV` だけを見ているので、E2Eでも開発の既定値になる
- PR1で `.railway/railway.ts` のworkerに3つ、PR2でwebに `VAPID_PUBLIC_KEY` を `preserve()` で足す。`deploy/compose.yaml`(`${VAPID_PUBLIC_KEY:-}` の形で任意にする)、`deploy/.env.example`、`docs/user/deploy.md`、`docs/dev/railway.md` の初回セットアップにも足す

### worker(PR1)

#### 通知を保存したらジョブを積む

- `INotificationRepository.save` の戻り値を `Promise<Notification[]>` にし、`NotificationRepository` は `.onConflictDoNothing().returning()` で新しく入った通知だけを返す(push-4)
- `application/services/notification-service.ts` に `NotificationService` を作り、indexerは `INotificationRepository` の代わりにこれを使う。like・repost・follow・post の4つのindexerの `notificationRepository.save(...)` を置き換える

```ts
export class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async create({
    ctx,
    notifications,
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    notifications: Notification[];
    live: boolean;
    depth: number;
  }) {
    const saved = await this.notificationRepository.save({
      ctx,
      notifications,
    });
    if (!live || depth > 0) return; // push-2
    const threshold = Date.now() - 10 * 60 * 1000;
    for (const n of saved) {
      if (n.sortAt.getTime() < threshold) continue; // push-3
      ctx.afterCommit(() => this.jobScheduler.scheduleSendPushNotification(n));
    }
  }
}
```

- indexerの `upsert` は `depth` も受け取っているので、そのまま渡す(like・repost・followは引数の分割代入に `live`・`depth` を足す)
- `PostIndexer.createNotifications` の引数の型は `AfterCommitContext` に変える

#### ジョブ

- `packages/common/src/lib/interface/job-queue.ts` の `JobData` に `sendPushNotification: { recordUri: string; recipientDid: string }` を足す
- `IJobScheduler` に `scheduleSendPushNotification(notification: { recordUri: string; recipientDid: string })` を足し、`JobScheduler` と `InMemoryJobScheduler` に実装する。`jobId` や重複除去は付けない(重複はpush-4で防いでいる)
- `JobQueue` のキューは `queueOptions()`(リトライなし)で作る。リトライの間隔が10秒・1分・1時間・1日で、遅れて届く通知に意味がないため
- `SyncWorker` に `createWorker("sendPushNotification", ..., { concurrency: 8 })` を足す

#### 送信のユースケース

`application/use-cases/async/send-push-notification-use-case.ts`。

1. トランザクションの中で `IPushNotificationQuery.findContent({ recordUri, recipientDid })` で通知の中身を読む。なければ終わる(push-5)
2. 同じトランザクションで `IPushSubscriptionQuery.findByAccountDid(recipientDid)` で端末を読む。0件なら終わる
3. トランザクションの外で、端末ごとに `IPushSender.send(subscription, payload)` を呼ぶ。`Promise.all` で並べ、1台の失敗が他の端末に影響しないよう、端末ごとに例外をつかんでwarnログにする
4. 結果のステータスが404か410の端末は、`IPushSubscriptionRepository.delete({ ctx, endpoint })` で消す(push-8)

payloadはJSON文字列にする。

```ts
{
  title: string;
  body: string;
  tag: string;
}
```

- `tag` は like と repost なら `${reason}:${reasonSubject}`、それ以外は `recordUri`(push-7)
- 名前と本文は `findContent` が `notifications` から `accounts.handle`・`profiles.displayName`・`posts.text` を結合して返す。本文は like・repost なら `reasonSubject` の投稿、それ以外は `recordUri` の投稿、follow なら空
- 本文は切り詰めない(投稿は300文字以内で、Web Pushの上限4KBに収まる)

#### 置き場所

| interface                                                                                   | 実装                                                                      |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `queries/push-notification-query.ts` `IPushNotificationQuery`                               | `infrastructure/queries/push-notification-query.ts`                       |
| `queries/push-subscription-query.ts` `IPushSubscriptionQuery`                               | `infrastructure/queries/push-subscription-query.ts`                       |
| `repositories/push-subscription-repository.ts` `IPushSubscriptionRepository`(`delete` だけ) | `infrastructure/repositories/push-subscription-repository/`               |
| `external/push-sender.ts` `IPushSender`                                                     | `infrastructure/push-sender/push-sender.ts` と `push-sender.in-memory.ts` |

既存のクエリ・リポジトリと同じ並びに置き、`shared/registry.ts` に登録する。

#### IPushSender

```ts
export interface IPushSender {
  send: (
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: string,
  ) => Promise<{ statusCode: number }>;
}
```

- 実装は `web-push` を使う。`webpush.sendNotification` は https しか送れないので、`webpush.generateRequestDetails(subscription, payload, { vapidDetails, TTL: 24 * 60 * 60, urgency: "high" })` で暗号化したリクエストを作り、`fetch(details.endpoint, { method: details.method, headers: details.headers, body: details.body })` で送る。E2Eで `http://127.0.0.1` の受け口に送れるようにするため
- VAPIDの3つの環境変数のどれかがなければ、`send` は `Error("VAPID keys are not configured")` を投げる。webに公開鍵がなければ購読は作られないので、ここに来るのは設定の誤りのときだけ
- `web-push` は worker の dependencies に足す(型は `@types/web-push`)。registryで直接importせず、このクラスの中に閉じ込める
- in-memory実装は送った `{ subscription, payload }` を配列に貯め、`setStatusCode(endpoint, code)` で返すステータスを変えられるようにする(既定は201)

#### テスト

`apps/worker/src/presentation/push-notification.test.ts` に push-1〜push-8 を1つずつ書く。`sync-tap-repo.test.ts` と同じく `setupJobTest` で `indexCommit` からジョブの実行までを通す。

- `shared/job-test-utils.ts` に `runSendPushNotificationJobs` と、in-memoryの `IPushSender` を返すようにする
- 購読は `@repo/test-utils` にファクトリを足すか、テスト内で `ctx.db.insert(schema.pushSubscriptions)` する
- push-2は `live: false` のイベントと、`fetchRecord` で取得した投稿(depth 1)の両方で送らないことを確かめる
- push-3は `createdAt` を11分前にしたレコードで確かめる
- push-4は同じ投稿の `update` イベントを送り直す
- push-5はジョブを実行する前にいいねを削除する
- push-7は同じ投稿への2件のいいねの `tag` が同じで、リプライの `tag` が別になることを確かめる

既存の notify-* のテストは indexer のテストにあり、indexerの依存が `NotificationService` に変わるので、そのテストのregistryも合わせて直す。

### web(PR2)

#### API

`apps/web/app/routes/api.push-subscription.ts`。`loginRequiredMiddleware` を付ける。

- loader(GET): `{ vapidPublicKey: string | null }` を返す
- action(POST): JSON `{ endpoint, keys: { p256dh, auth } }` を受け取り、`push_subscriptions` に upsert する。`createdAt` は今
- action(DELETE): JSON `{ endpoint }` を受け取り、`endpoint` とログイン中のDIDの両方が一致する行を消す

入力はフォームではないので、conformではなくzodで検証する。`endpoint` は `z.url()` にし、本番(`isProduction`)では `https://` で始まるものだけを受け付ける。workerが任意のURLへPOSTしないようにするため。

ユースケースは `application/notification/save-push-subscription-use-case.ts` と `delete-push-subscription-use-case.ts`、DBへの書き込みは `infrastructure/notification/push-subscription-command.ts`(`IPushSubscriptionCommand`)。公開鍵はroutesで `env` から読んでよい。webはOAuthのセッションと同じく `di.db` で直接書く(appviewを経由しない)。

#### Service Worker

`apps/web/public/sw.js`(ビルドしない素のJS)。

```js
self.addEventListener("push", (event) => {
  const { title, body, tag } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/notifications"));
});
```

Service Workerは「オンにする」を押したときに初めて登録する。オンにしない人には登録しない。

#### ブラウザ側の処理

`apps/web/app/lib/push-subscription.ts` に置く。

- `getPushStatus(vapidPublicKey: string | null)`: 次の順に判定して返す
  1. `vapidPublicKey` が null → `"unavailable"`
  2. `serviceWorker`・`PushManager`・`Notification` のどれかがない → `"unsupported"`
  3. `Notification.permission === "denied"` → `"denied"`
  4. `navigator.serviceWorker.getRegistration()` の `pushManager.getSubscription()` があれば `"on"`、なければ `"off"`
- `subscribePush(vapidPublicKey)`: `Notification.requestPermission()` が `"granted"` でなければ終わる。`navigator.serviceWorker.register("/sw.js")` → `navigator.serviceWorker.ready` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey })` → `subscription.toJSON()` を POST する
- `unsubscribePush()`: 購読があれば `unsubscribe()` して、その `endpoint` を DELETE する。なければ何もしない

#### UI

- `features/notification/push-setting.tsx`(Presentational)と `push-setting-container.tsx`(Container)を作り、`NotificationPanel` の見出しの下に置く。行は左に文、右にボタン。見た目は apps/web/DESIGN.md に従う
- Containerは TanStack Query のキー `["pushSetting"]` で `{ status }` を取る。queryFnは `/api/push-subscription` を取ってから `getPushStatus` を呼ぶ。SSR中は取らない(`unavailable` と同じく何も出さない)
- 切り替えは `useMutation` で `subscribePush` / `unsubscribePush` を呼び、終わったら `["pushSetting"]` を invalidate する。実行中はボタンを disabled にしてスピナーを出す(pushSetting-s5)
- `status` ごとの表示は仕様の pushSetting-s1〜s4 のとおり。`unavailable` と、読み込み中・読み込みに失敗したときは何も出さない
- ログアウト: `side-nav.tsx` と `mobile-header.tsx` のログアウトのフォームで、送信の前に `unsubscribePush()` を待つ(失敗しても無視してログアウトする)

#### テスト

- play: `apps/web/app/pages/client/notifications-page.stories.tsx` に pushSetting-s1〜s5 のstoryを足す。`queryClient.setQueryData(["pushSetting"], { status })` で状態を決める。s5は `status: "off"` にし、storyの `beforeEach` で `Notification.requestPermission` を終わらない Promise を返す関数に差し替えてから「オンにする」を押す。pages配下のstoryはVRTの対象なので、足したstoryのスナップショットも追加する
- E2E: `e2e/tests/web-client/push-setting.spec.ts` に pushSetting-e1〜e3 を書く
  - テストの中で `http.createServer` を `127.0.0.1` の空いているポートで立て、受け取ったリクエストのパスを記録する(201を返す)。これをプッシュサーバーの代わりにする
  - `context.grantPermissions(["notifications"])` で許可し、`page.addInitScript` で `PushManager.prototype.subscribe` と `getSubscription` を差し替える。`subscribe` は呼ばれるたびに用意した endpoint(`http://127.0.0.1:{port}/a`、`/b` …)を順に使った購読を返し、`unsubscribe()` で消える。鍵は `crypto.createECDH("prime256v1")` で作った公開鍵(base64url)と16バイトの `auth` を渡す(workerが実際に暗号化するため)
  - 通知は notification.spec.ts と同じく、alice の投稿に bob がいいねして起こす
  - e1: オン(`/a`)→ いいね → `/a` に届く
  - e2: オン(`/a`)→ オフ → オン(`/b`)→ いいね → `/b` に届き、`/a` には届かない
  - e3: オン(`/a`)→ ログアウト。別のcontext(aliceのstorageState)でオン(`/b`)→ いいね → `/b` に届き、`/a` には届かない
  - e2・e3 は届かないことを待つのではなく、後から登録した端末に届いたことを確かめてから、先の端末に届いていないことを見る。同じ通知は1つのジョブで全端末に送るので、これで決まる
