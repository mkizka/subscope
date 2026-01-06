# subscope パッケージ統合計画

## 概要

admin, blob-proxy, appview を1つの subscope パッケージに統合する。

## 決定事項

- 1プロセスで統合起動、元の3アプリは廃止予定
- フロントエンドはPreactに統一
- 各featureは `express.Router` をexportし、`bootstrap/server.ts` で統合

## ディレクトリ構成

```
apps/subscope/src/
├── features/
│   ├── blob-proxy/              # 画像キャッシュ機能
│   │   ├── domain/
│   │   │   ├── image-preset.ts
│   │   │   ├── cache-metadata.ts
│   │   │   └── image-blob.ts
│   │   ├── application/
│   │   │   ├── image-proxy-use-case.ts
│   │   │   └── services/
│   │   ├── infrastructure/
│   │   │   ├── blob-fetcher.ts
│   │   │   ├── image-resizer.ts
│   │   │   └── image-disk-storage.ts
│   │   └── presentation/
│   │       └── router.ts        # express.Router をexport
│   │
│   ├── login/                   # OAuth認証機能
│   │   ├── application/
│   │   ├── infrastructure/
│   │   │   └── oauth/           # client, session, storage
│   │   └── presentation/
│   │       └── router.ts        # express.Router をexport
│   │
│   └── xrpc/                    # XRPC API (appview + admin XRPC統合)
│       ├── domain/
│       │   ├── models/
│       │   └── service/
│       ├── application/
│       │   ├── services/        # ActorService, FeedService等
│       │   └── use-cases/
│       │       ├── actor/       # GetProfileUseCase等
│       │       ├── feed/        # GetTimelineUseCase等
│       │       ├── graph/       # GetFollowsUseCase等
│       │       └── admin/       # CreateInviteCodeUseCase等
│       ├── infrastructure/
│       │   ├── actor-repository/
│       │   ├── post-repository/
│       │   └── ...
│       └── presentation/
│           ├── middleware/      # admin-middleware等
│           └── router.ts        # express.Router をexport
│
├── bootstrap/
│   ├── server.ts                # 全Routerを統合してExpress起動
│   └── dashboard.ts             # BullMQダッシュボード設定
│
├── client/                      # Preactフロントエンド
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── admin/               # 管理画面UI (Preact移植)
│   └── app.tsx
│
├── shared/
│   └── env.ts                   # 統合環境変数
│
└── subscope.ts                  # エントリーポイント (DI構築)
```

## 各レイヤーの責務

| レイヤー                            | 責務                                   |
| ----------------------------------- | -------------------------------------- |
| `features/*/domain/`                | ドメインモデル、ビジネスルール         |
| `features/*/application/`           | ユースケース、アプリケーションサービス |
| `features/*/infrastructure/`        | リポジトリ実装、外部サービス連携       |
| `features/*/presentation/router.ts` | express.Routerをexport                 |
| `bootstrap/server.ts`               | 全Routerを統合、Express起動            |
| `bootstrap/dashboard.ts`            | BullMQダッシュボード設定               |

## feature間の依存関係

```
login ──────────────→ (独立)
blob-proxy ─────────→ (独立)
xrpc ───────────────→ @repo/common/domain (共有ドメインモデル)
```

- `login`, `blob-proxy` は他featureに依存しない
- `xrpc` は `@repo/common/domain` の共有モデル (Actor, Post, InviteCode等) を使用
- feature間の直接importは原則禁止（必要な場合は `@repo/common` に抽出）

## 移行元ファイルの対応

| 移行元                                                  | 移行先                                  |
| ------------------------------------------------------- | --------------------------------------- |
| `apps/appview/src/`                                     | `features/xrpc/`                        |
| `apps/blob-proxy/src/`                                  | `features/blob-proxy/`                  |
| `apps/admin/app/server/oauth/`                          | `features/login/infrastructure/oauth/`  |
| `apps/admin/app/server/routes/dashboard.ts`             | `bootstrap/dashboard.ts`                |
| `apps/subscope/src/server/presentation/routes/oauth.ts` | `features/login/presentation/router.ts` |
