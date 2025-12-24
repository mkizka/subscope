---
name: testing
description: プロジェクトのテスト実装ガイドラインに従ってテストコードを生成・レビューします。テストケースの作成、既存テストのレビュー、テストのリファクタリング時に使用してください。
---

# Testing

プロジェクトのテスト実装ガイドラインに従ってテストコードを生成・レビューする専門スキル

## テストケース名の規則

日本語で「(条件)場合、(期待値)」形式で記述します。

良い例:

- "投稿が見つからない場合はnotFoundPostを返す"
- "フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す"
- "subscriberの投稿は保存すべき"

悪い例:

- "正しいデータを返す"
- "エラーハンドリング"

## Arrange-Act-Assertパターン

全てのテストケースは以下の構造で記述します:

```typescript
test("(条件)場合、(期待値)", async () => {
  // arrange
  // テストデータの準備
  // act
  // テスト対象の実行
  // assert
  // 結果の検証
});
```

act & assertを同じ行で書く場合:

```typescript
test("handleが解決できない場合、HandleResolutionErrorをスローする", async () => {
  // arrange
  const uri = new AtUri("at://notfound.example/app.bsky.feed.post/abc123");

  // act & assert
  await expect(atUriService.resolveHostname(uri)).rejects.toThrow(
    HandleResolutionError,
  );
});
```

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

## recordFactoryの使用例

```typescript
// 基本的な投稿
const record = recordFactory({
  uri: `at://${author.did}/app.bsky.feed.post/postkey123`,
  json: {
    $type: "app.bsky.feed.post",
    text: "test post",
    createdAt: new Date().toISOString(),
  },
});

// リプライを含む投稿
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

## アサーションのベストプラクティス

### toMatchObjectで部分一致

```typescript
expect(result).toMatchObject({
  feed: [
    {
      $type: "app.bsky.feed.defs#feedViewPost",
      post: {
        uri: post.uri,
        author: {
          displayName: "Expected User",
        },
      },
    },
  ],
});
```

### 配列の部分一致

```typescript
expect(actorStatsJobs).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      data: {
        did: author.did,
        type: "posts",
      },
    }),
  ]),
);
```

### エラーの検証

```typescript
await expect(service.execute(uri)).rejects.toThrow(HandleResolutionError);
await expect(service.execute(uri)).rejects.toThrow(
  "Failed to resolve handle: notfound.example",
);
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
