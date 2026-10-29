---
name: xrpc-implementation
description: "subscopeプロジェクトにおけるAT Protocol XRPCエンドポイント(Query/Procedure)の実装ガイド。新しいXRPCエンドポイントの追加、Lexicon定義のセットアップ、クライアントコード生成、ルートハンドラー実装、DIコンテナ登録、テスト作成を行う際に使用する。「XRPCエンドポイントを追加」「Lexiconを実装」「新しいQueryを作る」「getFollowsを実装して」などのタスクで発動する。"
---

# XRPC Endpoint Implementation Guide

AT ProtocolのXRPCエンドポイントを`apps/appview`に追加するためのスキル。

## 実装フロー

1. `docs/specs/appview.md` にIDを振った仕様項目を追加する
2. Lexicon定義を取得する
   - `pnpm --filter @repo/client exec lex install <NSID>` で`packages/client/lexicons`と`lexicons.json`に追加される
   - `pnpm build`や`pnpm typecheck`で`@repo/client`のコードが生成される
   - Lexicon定義ファイルは手動で作成しない
3. 必要に応じてRepository・Serviceを拡張する
4. UseCaseを作成する。戻り値の型は生成コードの`$OutputBody`を使う
5. ルートハンドラーを作成し、`LexRouter`に登録する
6. `apps/appview/src/shared/registry.ts`に登録し、`apps/appview/src/presentation/routes/lex.ts`の`lexRouterFactory`の引数・`handlers`に追加する
7. UseCaseのunitテストと、仕様項目IDを先頭に付けたAPIテストを追加する
8. `pnpm all`を実行する

## ファイル配置規則

| レイヤー         | パス                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| 仕様             | `docs/specs/appview.md`                                                              |
| Repository IF    | `apps/appview/src/application/interfaces/{entity}-repository.ts`                     |
| Repository実装   | `apps/appview/src/infrastructure/{entity}-repository/{entity}-repository.ts`         |
| UseCase          | `apps/appview/src/application/use-cases/{category}/{endpoint-name}-use-case.ts`      |
| ルートハンドラー | `apps/appview/src/presentation/routes/{namespace}/{category}/{endpointName}.ts`      |
| APIテスト        | `apps/appview/src/presentation/routes/{namespace}/{category}/{endpointName}.test.ts` |
| DIコンテナ       | `apps/appview/src/shared/registry.ts`, `apps/appview/src/shared/test-utils.ts`       |
| ルーター         | `apps/appview/src/presentation/routes/lex.ts`                                        |

## ルートハンドラー

生成コードはモジュールごとにdefault importし、`router.add`に渡す。

```typescript
import type { LexRouter } from "@atproto/lex-server";
import getFollows from "@repo/client/lex/app/bsky/graph/getFollows";

export class GetFollows {
  constructor(
    private getFollowsUseCase: GetFollowsUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getFollows, async ({ params }) => {
      const actorDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );
      const result = await this.getFollowsUseCase.execute({
        actorDid,
        limit: params.limit,
        cursor: params.cursor,
      });
      return { body: result };
    });
  }
}
```

- パラメータは`LexRouter`がLexiconに沿って検証・デフォルト値補完する
- 認証が必要な場合は`router.add(nsid, { auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx), handler })`の形にし、`handler`で`credentials.did`を使う
- エラーは`LexServerError`を投げる（例: `new LexServerError(400, { error: "InvalidRequest", message: "List not found" })`）

## APIテスト

```typescript
const { client } = await setupApiTest();
const res = await client.call(getFollows, {
  actor: asAtIdentifierString(actor.did),
});
```

`client`は`@atproto/lex`の`Client`で、レスポンスをLexiconで検証する。

## 実装例

`app.bsky.graph.getFollows`:

- UseCase: `apps/appview/src/application/use-cases/graph/get-follows-use-case.ts`
- Route: `apps/appview/src/presentation/routes/app/bsky/graph/getFollows.ts`
- APIテスト: `apps/appview/src/presentation/routes/app/bsky/graph/getFollows.test.ts`
- UseCaseテスト: `apps/appview/src/application/use-cases/graph/get-follows-use-case.test.ts`
