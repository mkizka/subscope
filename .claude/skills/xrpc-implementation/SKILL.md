---
name: xrpc-implementation
description: "subscopeプロジェクトにおけるAT Protocol XRPCエンドポイント(Query/Procedure)の実装ガイド。新しいXRPCエンドポイントの追加、Lexicon定義のセットアップ、クライアントコード生成、ルートハンドラー実装、DIコンテナ登録、テスト作成を行う際に使用する。「XRPCエンドポイントを追加」「Lexiconを実装」「新しいQueryを作る」「getFollowsを実装して」などのタスクで発動する。"
---

# XRPC Endpoint Implementation Guide

AT ProtocolのXRPCエンドポイントをsubscopeプロジェクトに追加するためのスキル。

## 実装フロー

1. Lexicon定義の配置とクライアントコード生成
2. Repository拡張（必要に応じて）
3. UseCase作成
4. ルートハンドラー作成
5. DIコンテナ登録
6. テスト実装
7. 型チェック・フォーマット確認（`pnpm all`）

各ステップのコード例とテンプレートは [references/guide.md](references/guide.md) を参照。

## ファイル配置規則

| レイヤー            | パス                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| Lexicon postinstall | `packages/client/scripts/postinstall.sh`                                      |
| 型エクスポート      | `packages/client/src/server.ts`                                               |
| Repository IF       | `apps/subscope/src/application/interfaces/{entity}-repository.ts`             |
| Repository実装      | `apps/subscope/src/infrastructure/{entity}-repository.ts`                     |
| UseCase             | `apps/subscope/src/application/{endpoint-name}-use-case.ts`                   |
| ルートハンドラー    | `apps/subscope/src/presentation/routes/app/bsky/{category}/{endpointName}.ts` |
| DIコンテナ          | `apps/subscope/src/appview.ts`                                                |
| XRPCルーター        | `apps/subscope/src/presentation/routes/xrpc.ts`                               |
| テスト              | `apps/subscope/src/application/{endpoint-name}-use-case.test.ts`              |

## 重要な注意点

- `pnpm install` でLexiconファイル取得とクライアントコード生成が自動実行される
- ProfileView vs ProfileViewDetailed の型の違いに注意（Lexiconが期待する型に合わせる）
- DIコンテナの `static inject` 配列はコンストラクタ引数順と一致させる
- カーソルペジネーションでは `limit + 1` 件取得して次ページ有無を判定する
- 実装完了後は `pnpm all` で型チェック・フォーマット・テストを実行する

## 実装例

`app.bsky.graph.getFollows` の実装ファイル：

- UseCase: `apps/subscope/src/application/get-follows-use-case.ts`
- Repository: `apps/subscope/src/infrastructure/follow-repository.ts`
- Route: `apps/subscope/src/presentation/routes/app/bsky/graph/getFollows.ts`
- Test: `apps/subscope/src/application/get-follows-use-case.test.ts`
