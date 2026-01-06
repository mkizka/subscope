# subscope パッケージ統合計画

## 概要

admin, blob-proxy, appview を1つの subscope パッケージに統合する。

## 決定事項

- 1プロセスで統合起動、元の3アプリは廃止予定
- フロントエンドはPreactに統一
- 各featureは `router.ts` で依存関係を解決し `express.Router` をexport
- `subscope.ts` は各featureのrouterを受け取り `SubscopeServer` を起動するだけ

## ディレクトリ構成

```
apps/subscope/src/
├── features/
│   ├── client/                  # Preactフロントエンド配信
│   │   └── router.ts            # express.Router をexport
│   │
│   ├── dashboard/               # BullMQダッシュボード
│   │   ├── dashboard.ts         # ダッシュボード設定
│   │   └── router.ts            # DIを解決してRouterをexport
│   │
│   ├── oauth/                   # OAuth認証機能
│   │   ├── infrastructure/
│   │   │   ├── client.ts        # NodeOAuthClient設定
│   │   │   ├── session.ts       # セッション管理
│   │   │   └── storage.ts       # State/Session永続化
│   │   ├── presentation/
│   │   │   ├── middleware.ts    # 認証ミドルウェア
│   │   │   └── oauth.ts         # OAuthルート定義
│   │   └── router.ts            # DIを解決してRouter, middlewareをexport
│   │
│   ├── blob-proxy/              # 画像キャッシュ機能 (未実装)
│   │   └── router.ts
│   │
│   └── xrpc/                    # XRPC API (未実装)
│       └── router.ts
│
├── bootstrap/
│   └── server.ts                # 全Routerを統合してExpress起動
│
├── client/                      # Preactフロントエンド
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── admin.tsx
│   ├── app.tsx
│   └── main.tsx
│
├── shared/
│   └── env.ts                   # 統合環境変数
│
└── subscope.ts                  # エントリーポイント (各routerを統合)
```

## 各レイヤーの責務

| レイヤー                       | 責務                                    |
| ------------------------------ | --------------------------------------- |
| `features/*/infrastructure/`   | 外部サービス連携、リポジトリ実装        |
| `features/*/presentation/*.ts` | ルート定義、ミドルウェア                |
| `features/*/router.ts`         | DIを解決してRouter/middlewareをexport   |
| `bootstrap/server.ts`          | 全Routerを受け取りExpress起動           |
| `subscope.ts`                  | 各featureのrouterを統合してサーバー起動 |

## feature間の依存関係

```
client ─────────────→ (独立)
dashboard ──────────→ @repo/common/infrastructure (JobQueue)
oauth ──────────────→ @repo/common/infrastructure (DB, Logger)
blob-proxy ─────────→ (独立、未実装)
xrpc ───────────────→ @repo/common/domain (共有ドメインモデル、未実装)
```

- 各featureは `router.ts` で独自にDIを解決し、依存関係を完結させる
- feature間の直接importは原則禁止（必要な場合は `@repo/common` に抽出）

## 移行元ファイルの対応

| 移行元                                      | 移行先                           |
| ------------------------------------------- | -------------------------------- |
| `apps/appview/src/`                         | `features/xrpc/`                 |
| `apps/blob-proxy/src/`                      | `features/blob-proxy/`           |
| `apps/admin/app/server/oauth/`              | `features/oauth/infrastructure/` |
| `apps/admin/app/server/routes/dashboard.ts` | `features/dashboard/`            |
