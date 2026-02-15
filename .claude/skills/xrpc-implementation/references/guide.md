# XRPC実装 詳細ガイド

## 目次

1. [Lexicon定義の配置](#1-lexicon定義の配置)
2. [Repository拡張](#2-repository拡張)
3. [UseCase作成](#3-usecase作成)
4. [ルートハンドラー作成](#4-ルートハンドラー作成)
5. [DIコンテナ登録](#5-diコンテナ登録)
6. [型の互換性確保](#6-型の互換性確保)
7. [テスト実装](#7-テスト実装)
8. [トラブルシューティング](#8-トラブルシューティング)

## 1. Lexicon定義の配置

### 1.1 postinstall.shの更新

`packages/client/scripts/postinstall.sh` の `paths` 配列にファイルパスを追加：

```bash
paths=(
  # ... 既存のパス
  "app/bsky/graph/getFollows.json" # 新しく追加
)
```

### 1.2 クライアントコード生成

`pnpm install` を実行。以下が自動で行われる：

- bluesky-social/atprotoリポジトリからlexicon定義を取得
- `packages/client/lexicons` にコピー
- `@atproto/lex-cli` でクライアントコード生成

### 1.3 型エクスポート（必要に応じて）

`packages/client/src/server.ts` に追加：

```typescript
export * as AppBskyGraphGetFollows from "./generated/server/types/app/bsky/graph/getFollows";
```

**注意**: これは型定義のエクスポートのみ。XRPCエンドポイント自体は自動生成される `packages/client/src/generated/server/index.ts` で処理されるため、手動での追加は不要。

## 2. Repository拡張

### インターフェース

`apps/subscope/src/application/interfaces/{entity}-repository.ts`:

```typescript
export interface I{Entity}Repository {
  find{Entities}: (params: {
    db: DatabaseClient;
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<{Entity}[]>;
}
```

### 実装

`apps/subscope/src/infrastructure/{entity}-repository.ts`:

```typescript
async find{Entities}(params: {
  db: DatabaseClient;
  actorDid: Did;
  limit: number;
  cursor?: string;
}): Promise<{Entity}[]> {
  const filters = [eq(schema.{table}.actorDid, params.actorDid.toString())];

  if (params.cursor) {
    const cursor = new Date(params.cursor);
    filters.push(lt(schema.{table}.sortAt, cursor));
  }

  const results = await params.db.query.{table}.findMany({
    where: and(...filters),
    orderBy: [desc(schema.{table}.sortAt)],
    limit: params.limit,
  });

  return results.map((result) => this.convertTo{Entity}(result));
}
```

## 3. UseCase作成

`apps/subscope/src/application/{endpoint-name}-use-case.ts`:

```typescript
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

type {EndpointName}Params = {
  db: DatabaseClient;
  actor: string;
  limit: number;
  cursor?: string;
};

export class {EndpointName}UseCase {
  constructor(
    private readonly {entity}Repository: I{Entity}Repository,
    private readonly handleResolver: IHandleResolver,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["{entity}Repository", "handleResolver", "profileViewService"] as const;

  async execute(params: {EndpointName}Params) {
    // DIDまたはハンドルの解決
    let actorDid: ReturnType<typeof asDid>;
    if (params.actor.startsWith("did:")) {
      actorDid = asDid(params.actor);
    } else {
      const resolved = await this.handleResolver.resolveMany([params.actor as Handle]);
      const did = resolved[params.actor as Handle];
      if (!did) {
        throw new Error("Actor not found");
      }
      actorDid = did;
    }

    // limit + 1件取得してカーソルペジネーション判定
    const results = await this.{entity}Repository.find{Entities}({
      db: params.db,
      actorDid,
      limit: params.limit + 1,
      cursor: params.cursor,
    });

    const hasMore = results.length > params.limit;
    const finalResults = hasMore ? results.slice(0, params.limit) : results;
    const cursor = hasMore && results.length > params.limit
      ? results[params.limit - 1]?.createdAt.toISOString()
      : undefined;

    return {
      cursor,
      // Lexiconに合わせた形式でデータ変換
    };
  }
}
```

## 4. ルートハンドラー作成

`apps/subscope/src/presentation/routes/app/bsky/{category}/{endpointName}.ts`:

```typescript
import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import type { DatabaseClient } from "@repo/common/domain";
import { isHandle } from "@repo/common/utils";

export class {EndpointName} {
  constructor(
    private {endpointName}UseCase: {EndpointName}UseCase,
    private db: DatabaseClient,
  ) {}
  static inject = ["{endpointName}UseCase", "db"] as const;

  handle(server: Server) {
    server.app.bsky.{category}.{endpointName}({
      handler: async ({ params }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          return { status: 400, message: "Invalid actor" };
        }

        const result = await this.{endpointName}UseCase.execute({
          db: this.db,
          actor: params.actor,
          limit: params.limit || 50,
          cursor: params.cursor,
        });

        return { encoding: "application/json", body: result };
      },
    });
  }
}
```

## 5. DIコンテナ登録

### appview.tsへの登録

`apps/subscope/src/appview.ts`:

```typescript
import { {EndpointName}UseCase } from "./application/{endpoint-name}-use-case.js";
import { {EndpointName} } from "./presentation/routes/app/bsky/{category}/{endpointName}.js";

createInjector()
  // application
  .provideClass("{endpointName}UseCase", {EndpointName}UseCase)
  // presentation
  .provideClass("{endpointName}", {EndpointName})
```

### XRPCルーターへの登録

`apps/subscope/src/presentation/routes/xrpc.ts`:

```typescript
import type { {EndpointName} } from "./app/bsky/{category}/{endpointName}.js";

export class XRPCRouter {
  constructor(
    // ... 既存のパラメーター
    private {endpointName}: {EndpointName},
  ) {}
  static inject = [
    // ... 既存の依存
    "{endpointName}",
  ] as const;

  applyRoutes(server: Server) {
    // ... 既存のルート
    this.{endpointName}.handle(server);
  }
}
```

## 6. 型の互換性確保

Lexiconが `ProfileView` を期待する場合、`ProfileViewDetailed` を返すメソッドとは別に作成：

```typescript
// ProfileViewServiceに追加
async findProfileView(handleOrDids: HandleOrDid[]): Promise<AppBskyActorDefs.ProfileView[]> {
  const profiles = await this.findProfile(handleOrDids);
  return profiles.map((profile) => ({
    ...this.createProfileViewBasic(profile),
    $type: "app.bsky.actor.defs#profileView" as const,
    description: profile.description ?? undefined,
    indexedAt: profile.indexedAt?.toISOString(),
  }));
}
```

## 7. テスト実装

`apps/subscope/src/application/{endpoint-name}-use-case.test.ts`:

```typescript
import { setupTestDatabase } from "@repo/test-utils/setup";
import { actorFactory, followFactory } from "@repo/test-utils/factories";
import { describe, test, expect } from "vitest";

describe("{EndpointName}UseCase", () => {
  const ctx = setupTestDatabase();

  test("基本的なケースのテスト", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User" }))
      .create();

    // act
    const result = await {endpointName}UseCase.execute({
      db: ctx.db,
      actor: actor.did,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      // 期待される結果
    });
  });
});
```

## 8. トラブルシューティング

### クライアントコードが生成されない

- `pnpm build --force` でキャッシュクリア後再ビルド
- `postinstall.sh` のパスを確認
- `pnpm install` を再実行

### 型エラーが発生する

- Lexicon定義と実装の型が一致しているか確認
- ProfileView vs ProfileViewDetailed など型の違いに注意
- DIコンテナの登録漏れを確認

### ESLintエラー

- `params.limit ?? 50` → `params.limit || 50` に変更
- 冗長な型定義を削除（`Handle | string` → `string`）
- ファイル末尾に改行を追加
