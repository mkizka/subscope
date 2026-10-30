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

## 技術選定

| 項目           | 採用                                                  |
| -------------- | ----------------------------------------------------- |
| フレームワーク | React Router (framework mode)                         |
| データ取得     | loader / action、useLoaderData、useSubmit、useFetcher |
| UI             | Tailwind CSS + daisyUI                                |
| アイコン       | lucide-react                                          |

- tRPC は使わない
- API の型は React Router の型生成（`Route.ComponentProps` 等）を使う

## UIの方針

- チャットツール（Slack / Discord）の画面構成を土台に、SNSとして使いやすく調整する
- Bluesky公式クライアントのクローンに見えないようにする
- 「招待制の自分のサーバー」であることを前に出す
- カスタムフィードは扱わない

## デザイン

- daisyUIのカスタムテーマを使い、ライト・ダークの両方を用意する
- 土台は白黒（墨）とし、ボタン・サーバー名・自分の操作にだけアクセント色を1色使う
- アクセント色はBluesky（青）、Mastodon（青紫）、Misskey（黄緑）と被らないテラコッタとし、テーマの `primary` だけを差し替える
- テーマは `apps/web/app/app.css` で daisyUI の `light` / `dark` を上書きして定義し、OSの設定で切り替える
- アイコンは潜望鏡の先端（くさび形のヘッドと丸いレンズ）を記号化した形とし、ヘッドは墨、レンズはアクセント色にする
  - `apps/web/public/favicon.svg` をfaviconとREADMEで共有し、ライト・ダークで色を切り替える

## 今後追加する画面

- ローカルタイムライン: サーバーのメンバー全員の投稿を流す（`me.subsco.feed.getLocalTimeline`）
- メンバー: サブスクライバーの一覧（`me.subsco.server.getMembers`）
