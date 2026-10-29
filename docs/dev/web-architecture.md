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
