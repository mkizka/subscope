# テストパターンと実装例

## 目次

- [テストデータ作成パターン](#テストデータ作成パターン)
  - [A. データベース使用（Repository層）](#a-データベース使用repository層)
  - [B. インメモリ実装（Application/Domain層）](#b-インメモリ実装applicationdomain層)
- [recordFactoryの使用例](#recordfactoryの使用例)
- [インメモリリポジトリのセットアップ](#インメモリリポジトリのセットアップ)
- [ctxオブジェクトの使用](#ctxオブジェクトの使用)
- [テストすべきケース](#テストすべきケース)
- [空行の使い方](#空行の使い方)
- [レイヤー別の使い分け](#レイヤー別の使い分け)

## テストデータ作成パターン

### A. データベース使用（Repository層）

`@repo/test-utils`のFactoryを使用:

```typescript
import { testSetup } from "@repo/test-utils";

describe("UseCase名", () => {
  const { testInjector, ctx } = testSetup;

  const useCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .injectClass(UseCase);

  test("テストケース名", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .create();

    // act & assert
  });
});
```

### B. インメモリ実装（Application/Domain層）

`@repo/common/test`のファクトリ関数を使用:

```typescript
import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { testInjector } from "../../../shared/test-utils.js";

describe("Service名", () => {
  const service = testInjector.injectClass(Service);
  const profileRepo = testInjector.resolve("profileRepository");

  test("テストケース名", async () => {
    // arrange
    const actor = actorFactory({ handle: "test.bsky.social" });
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Test User",
    });
    profileRepo.add(profile);

    // act & assert
  });
});
```

**重要**: インメモリリポジトリは`vitest.unit.setup.ts`で`setupFiles()`が呼ばれ、全てのリポジトリが`beforeEach`で自動的に`.clear()`される。新しいアプリを作成する場合は、`vitest.unit.setup.ts`に以下を記述する必要がある:

```typescript
import { setupFiles } from "./src/shared/test-utils.js";

setupFiles();
```

## recordFactoryの使用例

### 基本的な投稿

```typescript
const record = recordFactory({
  uri: `at://${author.did}/app.bsky.feed.post/postkey123`,
  json: {
    $type: "app.bsky.feed.post",
    text: "test post",
    createdAt: new Date().toISOString(),
  },
});
```

### リプライを含む投稿

```typescript
const record = recordFactory({
  uri: `at://${replier.did}/app.bsky.feed.post/reply123`,
  json: {
    $type: "app.bsky.feed.post",
    text: "reply to subscriber",
    reply: {
      parent: {
        uri: `at://${subscriberDid}/app.bsky.feed.post/original123`,
        cid: fakeCid(),
      },
      root: {
        uri: `at://${subscriberDid}/app.bsky.feed.post/original123`,
        cid: fakeCid(),
      },
    },
    createdAt: new Date().toISOString(),
  },
});
```

## インメモリリポジトリのセットアップ

```typescript
// HandleResolver
handleResolver.add("example.com", "did:plc:resolved123");

// IndexTargetRepository
await indexTargetRepo.addSubscriber(subscriberDid);
await indexTargetRepo.addTrackedActor(followeeDid);
```

## ctxオブジェクトの使用

一部のアプリケーションでは明示的にctxを作成:

```typescript
const ctx = {
  db: testInjector.resolve("db"),
};

await postIndexer.upsert({ ctx, record, depth: 0 });
```

## テストすべきケース

1. **正常系**: 基本的な動作が正しく機能する
2. **境界値**: 0, 1, 最大値などの境界値
3. **エッジケース**: データが見つからない、空の配列、nullなど
4. **エラーハンドリング**: 期待される例外が正しくスローされる
5. **副作用**: ジョブキュー追加、集計処理スケジュールなど

## 空行の使い方

- Arrange-Act-Assertの各セクション間に1行の空行
- テストケース間に1行の空行
- describeブロック内のセットアップとテストケース間に1行の空行

## レイヤー別の使い分け

- **Repository層**: `@repo/test-utils`のFactory + 実DB
- **Application層**: `@repo/common/test`のファクトリ関数 + インメモリ
- **Domain層**: ドメインモデル + インメモリ（必要に応じて）
