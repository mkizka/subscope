# XRPC Endpoint Implementation Guide

このドキュメントは、新しいXRPCエンドポイント（Query/Procedure）を実装する際の手順を記載しています。

## 概要

AT ProtocolのXRPCエンドポイントを追加する場合、Lexicon定義からクライアントコード生成、ルートハンドラー実装まで一連の手順が必要です。

## 実装手順

### 1. Lexicon定義の配置

#### 1.1 postinstall.shの更新

新しいLexiconファイルをクライアントパッケージにコピーするため、postinstall.shに追加します。

**ファイル:** `/packages/client/scripts/postinstall.sh`

```bash
# 例：app.bsky.graph.getFollowsを追加する場合
paths=(
  # ... 既存のパス
  "app/bsky/graph/follow.json"
  "app/bsky/graph/getFollows.json" # 新しく追加
  # ...
)
```

この一覧にファイルパスを追加することで、bluesky-social/atprotoリポジトリのlexiconディレクトリからファイルがコピーされ、クライアントコード生成に利用できるようになります。

#### 1.2 Lexiconファイルの配置とクライアントコード生成

```bash
# Lexiconファイルをコピー
pnpm install

# クライアントコードを生成
pnpm build

# キャッシュに問題がある場合
pnpm build --force
```

### 2. AppView実装（Queryエンドポイントの場合）

#### 2.1 Repositoryの拡張（必要に応じて）

既存のRepositoryに新しいメソッドが必要な場合：

**インターフェース:** `/apps/appview/src/application/interfaces/{entity}-repository.ts`

```typescript
export interface I{Entity}Repository {
  // 既存のメソッド...

  find{Entities}: (params: {
    db: DatabaseClient;
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<{Entity}[]>;
}
```

**実装:** `/apps/appview/src/infrastructure/{entity}-repository.ts`

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

#### 2.2 UseCaseの作成

**ファイル:** `/apps/appview/src/application/{endpoint-name}-use-case.ts`

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

    // データ取得とカーソルペジネーション
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

    // Lexiconに合わせた形式で返す
    return {
      cursor,
      // 必要なデータ変換
    };
  }
}
```

#### 2.3 ルートハンドラーの作成

**ファイル:** `/apps/appview/src/presentation/routes/app/bsky/{category}/{endpointName}.ts`

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
        // パラメータバリデーション
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          return {
            status: 400,
            message: "Invalid actor",
          };
        }

        const result = await this.{endpointName}UseCase.execute({
          db: this.db,
          actor: params.actor,
          limit: params.limit || 50,
          cursor: params.cursor,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
```

#### 2.4 DIコンテナへの登録

**ファイル:** `/apps/appview/src/appview.ts`

```typescript
// インポートを追加
import { {EndpointName}UseCase } from "./application/{endpoint-name}-use-case.js";
import { {EndpointName} } from "./presentation/routes/app/bsky/{category}/{endpointName}.js";

createInjector()
  // ... 既存の登録

  // application
  .provideClass("{endpointName}UseCase", {EndpointName}UseCase)

  // presentation
  .provideClass("{endpointName}", {EndpointName})

  // ... 残りの設定
```

**ファイル:** `/apps/appview/src/presentation/routes/xrpc.ts`

```typescript
// インポートを追加
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

### 3. 型の互換性確保

#### 3.1 ProfileView vs ProfileViewDetailed

Lexiconが`ProfileView`を期待する場合、既存の`ProfileViewDetailed`を返すメソッドとは別に新しいメソッドを作成する必要があります。

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

### 4. テストの実装

**ファイル:** `/apps/appview/src/application/{endpoint-name}-use-case.test.ts`

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

### 5. 最終確認

#### 5.1 型チェックとフォーマット

```bash
# 型チェック
pnpm typecheck

# フォーマットとlint
pnpm format
```

#### 5.2 実装リストの更新

`/docs/tasks.md`を更新して、実装済みのエンドポイントにチェックを入れます。

## トラブルシューティング

### クライアントコードが生成されない

1. `pnpm build --force`でキャッシュをクリアして再ビルド
2. postinstall.shにパスが正しく追加されているか確認
3. `pnpm install`を再実行

### 型エラーが発生する

1. Lexicon定義と実装の型が一致しているか確認
2. 必要に応じて新しいメソッドを作成（ProfileView vs ProfileViewDetailedなど）
3. DIコンテナへの登録漏れがないか確認

### ESLintエラー

1. `params.limit ?? 50`を`params.limit || 50`に変更
2. 冗長な型定義を削除（`Handle | string`→`string`）
3. ファイル末尾に改行を追加

## 実装例

実際の実装例として`app.bsky.graph.getFollows`の場合：

- UseCase: `/apps/appview/src/application/get-follows-use-case.ts`
- Repository: `/apps/appview/src/infrastructure/follow-repository.ts`
- Route: `/apps/appview/src/presentation/routes/app/bsky/graph/getFollows.ts`
- Test: `/apps/appview/src/application/get-follows-use-case.test.ts`

このガイドを参考に、任意のXRPCエンドポイントを実装できます。
