# appviewのビュー生成(ViewContext、*Views)

appviewはXRPCの応答に含めるビュー(profileView、postViewなど)を、lexiconの入れ子と同じ形の非同期関数で組み立てる。必要なデータは形にしながらその場で要求し、リクエストごとの読み取り器がまとめて取る。

## ViewContext

`apps/appview/src/application/views/view-context.ts` に置く。`ViewContextFactory.create(viewer)` でリクエストごとに作る。

- リポジトリごとに `Batch` を持ち、同じティックに届いた要求を1回のクエリにまとめ、結果をリクエスト内でキャッシュする。1対1は `Batch.one`、1対多は `Batch.many` で作り、取得した配列からキー関数で引き当てる
- `profile(did)` と `post(uri)` はテイクダウンされたものを返さない。著者が隠されていれば投稿も返さない。管理画面などの例外は `includeTakedowns` で切り替える
- 閲覧者ごとの状態(フォロー、いいね、リポスト)も閲覧者がいるときだけ取る
- 形にはしない

## *Views

`apps/appview/src/application/views/` に lexicon の defs と同じ単位で置く(ProfileViews、PostViews、EmbedViews、GeneratorViews、NotificationViews など)。

- `(対象, ctx)` を受け取り、ViewContext から取ったデータを lexicon の形にする。無ければ `undefined` を返し、置き換え(viewNotFound など)は呼び出し側の Views が決める
- lexicon の入れ子と同じ向きに互いを呼ぶ(FeedViews → PostViews → ProfileViews / EmbedViews)
- 兄弟は `Promise.all` で並べてから await する。順に await すると Batch がまとまらず、クエリが増える
- 状態を持たず、DI で組む。テイクダウンは知らない

## use case

`viewContextFactory.create(...)` で ctx を作り、欲しい Views を呼ぶだけにする。

## 移行中の古い構成

`application/loader/`、`application/visibility/`、`application/service/*/*-view-service.ts`、`FeedProcessor`、`ReplyRefService` は旧構成で、use case を順に移行したあとに消す。
