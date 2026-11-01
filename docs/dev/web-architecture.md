# Webクライアントの構成

## 概要

- apps/web は Bluesky クライアント相当の SNS 体験と管理画面を提供する
- ログインできるのはサブスクライバー（招待コードで登録したユーザー）と管理者のみ

## 構成

```
ブラウザ ──(/api/xxx, loader/action)──> apps/web(BFF) ──(XRPC)──> PDS ──(atproto-proxy)──> apps/appview
```

- OAuth はサーバー側の confidential client で行う
  - ブラウザ OAuth（public client）はセッション期限が短いため採用しない
  - セッションは Cookie で識別し、トークンはサーバーで保持する
- BFF のエンドポイントは XRPC の形に縛られず、画面が使いやすい形で返す
  - 内部で `@repo/client` を使って PDS に XRPC リクエストを送る
- 書き込み（投稿、いいね等）も BFF の action から PDS に XRPC で送る

## サーバー側の構成

- loader/action の処理は `apps/web/app/server` 以下にオニオンアーキテクチャで置き、routes は入力の検証・ユースケースの呼び出し・応答だけにする
- DI は `@gyaku/di` を使い、ファクトリ関数を `app/server/di.ts` で組み立てる
- 層の詳細は `.claude/skills/web-server/SKILL.md` を参照

## 技術選定

| 項目           | 採用                                                  |
| -------------- | ----------------------------------------------------- |
| フレームワーク | React Router (framework mode)                         |
| データ取得     | loader / action、useLoaderData、useSubmit、useFetcher |
| UI             | Tailwind CSS                                          |
| アイコン       | lucide-react                                          |

- tRPC は使わない
- API の型は React Router の型生成（`Route.ComponentProps` 等）を使う

## UIの方針

- 画面の構成はBluesky公式クライアントに寄せ、Blueskyが使えなくなったときに覚え直しをなくす
  - タイムラインは新しい投稿を上にする
  - 投稿欄は常に出さず、投稿ボタンから開く
  - スレッドは中央に広く表示する
  - スマホは下のタブ（ホーム・検索・通知・プロフィール）にする
- クローンを目指したものではないことが伝わるよう、色・ロゴ・フォントは公式と全く違うものにする
- カスタムフィードは扱わない

## デザイン

- UIライブラリは使わず、`apps/web/app/app.css` の `@theme` に定義した色トークンとTailwind CSSだけで書く。色・文字・余白・部品の使い方は [design.md](./design.md) に従う
  - ライト・ダークはOSの設定で切り替え、トークンの値だけを差し替える
- アクセント色は赤系（木苺）とし、ライトは `#B8326B`、ダークは `#E8709F` にする
- 背景は白黒ではなく、アクセント色をうっすら混ぜた色にする
- フォントは丸ゴシックのZen Maru Gothicを使う
- daisyUIは撤去中で、移行が済むまではdaisyUIのテーマ色を上の色トークンに向けている
- アイコンは潜望鏡の先端（くさび形のヘッドと丸いレンズ）を記号化した形とし、ヘッドは墨、レンズはアクセント色にする
  - `apps/web/public/favicon.svg` をfaviconとREADMEで共有し、ライト・ダークで色を切り替える

## 今後追加する画面

- ローカルタイムライン: サーバーのメンバー全員の投稿を流す（`me.subsco.feed.getLocalTimeline`）
