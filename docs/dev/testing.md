# テストケースの書き方ガイド

このドキュメントは、プロジェクトにおける良いテストケースの書き方について説明します。

## 基本原則

### 1. 日本語でのテストケース名

テストケース名は日本語で記述し、「～の場合、～する」のように条件と期待値を明確に表現します。

```typescript
// 良い例
test("投稿が見つからない場合はnotFoundPostを返す", async () => {
  // ...
});

test("フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す", async () => {
  // ...
});

// 悪い例
test("正しいデータを返す", async () => {
  // ...
});

test("エラーハンドリング", async () => {
  // ...
});
```

### 2. Arrange-Act-Assertパターン

テストケースは必ずArrange-Act-Assertパターンに従って構造化します。

```typescript
test("親投稿も子投稿もない単一投稿の場合、parentとrepliesが空のThreadViewPostを返す", async () => {
  // arrange
  const actor = await actorFactory(ctx.db)
    .use((t) => t.withProfile({ displayName: "Single User" }))
    .create();
  const record = await recordFactory(ctx.db, "app.bsky.feed.post")
    .vars({ actor: () => actor })
    .create();
  const post = await postFactory(ctx.db)
    .vars({ record: () => record })
    .create();

  // act
  const result = await getPostThreadUseCase.execute({
    uri: new AtUri(post.uri),
    depth: 6,
    parentHeight: 80,
  });

  // assert
  expect(result.thread).toMatchObject({
    $type: "app.bsky.feed.defs#threadViewPost",
    post: {
      uri: post.uri,
      author: {
        displayName: "Single User",
      },
    },
    parent: undefined,
    replies: [],
  });
});
```

### 3. 空行の使い方

Arrange-Act-Assertの各セクション間には1行の空行を入れます。テストケース間には1行の空行を入れます。

```typescript
describe("GetTimelineUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const getTimelineUseCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    // ... 他の依存関係
    .injectClass(GetTimelineUseCase);

  test("フォローしているユーザーがいない場合、空のタイムラインを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, actor.did);

    // assert
    expect(result).toMatchObject({
      feed: [],
    });
  });

  test("フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す", async () => {
    // arrange
    const authActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Auth User" }))
      .create();
    // ...

    // act
    const result = await getTimelineUseCase.execute(
      { limit: 50 },
      authActor.did,
    );

    // assert
    expect(result).toMatchObject({
      feed: [
        // ...
      ],
    });
  });
});
```

## Factoryの使い方

このプロジェクトでは、テストデータの作成にFactoryパターンを使用しています。`@repo/test-utils`パッケージから提供される各種Factoryを活用することで、一貫性のあるテストデータを簡潔に作成できます。

### テストセットアップ

テストファイルでは`getTestSetup()`を使用してテストインジェクターとデータベースコンテキストを取得します：

```typescript
import { LoggerManager } from "@repo/common/infrastructure";
import {
  actorFactory,
  actorStatsFactory,
  getTestSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

describe("UseCase名", () => {
  const { testInjector, ctx } = getTestSetup();

  const useCase = testInjector
    .provideValue("loggerManager", new LoggerManager("info"))
    .provideClass("repository", Repository)
    .injectClass(UseCase);

  test("テストケース名", async () => {
    // テスト実装
  });
});
```

### 基本的な使い方

```typescript
// シンプルなデータ作成
const actor = await actorFactory(ctx.db).create();

// 関連データを含む作成
const actor = await actorFactory(ctx.db)
  .use((t) => t.withProfile({ displayName: "Test User" }))
  .create();
```

### actorFactoryのtrait

`actorFactory`には以下のtraitが用意されています：

#### withProfile

プロフィールレコードとプロフィール情報を持つアカウントを作成します。

```typescript
const actor = await actorFactory(ctx.db)
  .use((t) => t.withProfile({ displayName: "Test User" }))
  .create();
```

#### subscriber

サブスクライバー(AppViewに登録したアカウント)として作成します。内部的にsubscriptionレコードも作成されます。

```typescript
const subscriberActor = await actorFactory(ctx.db)
  .use((t) => t.subscriber())
  .create();
```

### varsメソッドによる依存関係の定義

`vars`メソッドを使用して、他のFactoryで作成したデータを参照できます：

```typescript
const actor = await actorFactory(ctx.db).create();
const record = await recordFactory(ctx.db, "app.bsky.feed.post")
  .vars({ actor: () => actor })
  .create();
const post = await postFactory(ctx.db)
  .vars({ record: () => record })
  .create();
```

### propsメソッドによる属性のカスタマイズ

`props`メソッドを使用して、特定の属性値を設定できます：

```typescript
const post = await postFactory(ctx.db)
  .vars({ record: () => record })
  .props({
    text: () => "カスタムテキスト",
    createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
    replyRootUri: () => rootPost.uri,
    replyRootCid: () => rootPost.cid,
  })
  .create();
```

### 複数データの作成

`createList`メソッドを使用して、複数のデータを一度に作成できます：

```typescript
const [postStats1, postStats2] = await postStatsFactory(ctx.db).createList(2);
```

### 複雑な階層構造の作成例

リプライチェーンのような複雑な構造も、Factoryを組み合わせて構築できます：

```typescript
// ルート投稿
const rootActor = await actorFactory(ctx.db)
  .use((t) => t.withProfile({ displayName: "Root User" }))
  .create();
const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
  .vars({ actor: () => rootActor })
  .create();
const rootPost = await postFactory(ctx.db)
  .vars({ record: () => rootRecord })
  .create();

// リプライ投稿
const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
  .vars({ actor: () => replyActor })
  .create();
const replyPost = await postFactory(ctx.db)
  .vars({ record: () => replyRecord })
  .props({
    replyRootUri: () => rootPost.uri,
    replyRootCid: () => rootPost.cid,
    replyParentUri: () => rootPost.uri,
    replyParentCid: () => rootPost.cid,
  })
  .create();
```

### factoryについて分からないことがあるとき

使用しているfactory-jsライブラリについて知りたいときは、docs/factoryjs-repomix-output.xml を確認してください。

## 良いテストケースの特徴

### 1. 境界値テスト

limitやdepthなどのパラメータに対して、境界値（0、1、最大値など）をテストします。

```typescript
test("limitパラメータが0または1の場合、指定した件数の投稿を返す", async () => {
  // act - limit=0
  const zeroLimitResult = await getTimelineUseCase.execute(
    { limit: 0 },
    authActor.did,
  );

  // assert
  expect(zeroLimitResult).toMatchObject({
    feed: [],
  });

  // act - limit=1
  const oneLimitResult = await getTimelineUseCase.execute(
    { limit: 1 },
    authActor.did,
  );

  // assert
  expect(oneLimitResult).toMatchObject({
    feed: [
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: post.uri,
        },
      },
    ],
  });
});
```

### 2. エッジケースのテスト

通常のケースだけでなく、エラーケースや特殊な状況もテストします。

```typescript
test("handleが解決できない場合、notFoundPostを返す", async () => {
  // arrange
  const handleUri = new AtUri(
    "at://notfound.handle/app.bsky.feed.post/notfound123",
  );

  // act
  const result = await getPostThreadUseCase.execute({
    uri: handleUri,
    depth: 6,
    parentHeight: 80,
  });

  // assert
  expect(result.thread).toEqual({
    $type: "app.bsky.feed.defs#notFoundPost",
    uri: "at://notfound.handle/app.bsky.feed.post/notfound123",
    notFound: true,
  });
});
```

### 3. 複雑なデータ構造のテスト

階層構造や関連データがある場合は、それらを明確にセットアップし、検証します。

```typescript
test("リプライ投稿の場合、親投稿の階層構造をparentに含むThreadViewPostを返す", async () => {
  // arrange
  const rootActor = await actorFactory(ctx.db)
    .use((t) => t.withProfile({ displayName: "Root User" }))
    .create();
  const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
    .vars({ actor: () => rootActor })
    .create();
  const rootPost = await postFactory(ctx.db)
    .vars({ record: () => rootRecord })
    .create();

  const parentActor = await actorFactory(ctx.db)
    .use((t) => t.withProfile({ displayName: "Parent User" }))
    .create();
  // ... 親投稿の作成

  const targetActor = await actorFactory(ctx.db)
    .use((t) => t.withProfile({ displayName: "Target User" }))
    .create();
  // ... ターゲット投稿の作成

  // act
  const result = await getPostThreadUseCase.execute({
    uri: new AtUri(targetPost.uri),
    depth: 6,
    parentHeight: 10,
  });

  // assert
  expect(result.thread).toMatchObject({
    $type: "app.bsky.feed.defs#threadViewPost",
    post: {
      uri: targetPost.uri,
      author: {
        displayName: "Target User",
      },
    },
    parent: {
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: parentPost.uri,
        author: {
          displayName: "Parent User",
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: rootPost.uri,
          author: {
            displayName: "Root User",
          },
        },
      },
    },
  });
});
```

### 4. スパイの活用

内部的な呼び出し回数や引数を検証する場合は、viのスパイ機能を活用します。

```typescript
const spyFindByUri = vi.spyOn(PostRepository.prototype, "findByUri");
const spyFindReplies = vi.spyOn(PostRepository.prototype, "findReplies");

test("depthより大きい深さのリプライは取得しない", async () => {
  // ... arrange & act

  // assert
  // ターゲット投稿の取得で1回
  expect(spyFindByUri).toHaveBeenCalledTimes(1);
  // depth=2の制限により、ルート投稿と深さ1の投稿のリプライのみ取得（計2回）
  expect(spyFindReplies).toHaveBeenCalledTimes(2);
});
```

## アンチパターン

### 1. モックの乱用

外部システムとの接続を除き、原則としてモックは使用しません。実際のデータベースや実装を使用してテストを行います。

```typescript
// 悪い例
const mockRepository = mock<PostRepository>();
when(mockRepository.findByUri).thenReturn(mockPost);

// 良い例（実際のRepositoryとデータベースを使用）
const post = await postFactory(ctx.db).create();
const result = await postRepository.findByUri(post.uri);
```

### 2. 曖昧なアサーション

期待値は具体的に記述し、toMatchObjectを使用して必要な部分のみを検証します。

```typescript
// 悪い例
expect(result).toBeTruthy();
expect(result.feed.length).toBeGreaterThan(0);

// 良い例
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

### 3. テストケース内での条件分岐

テストケース内でif文やオプショナルチェインを使用することは避け、toMatchObjectなどで代替します。

```typescript
// 悪い例
test("投稿を取得する", async () => {
  const result = await getPost();
  if (result?.post) {
    expect(result.post.uri).toBe(expectedUri);
  }
});

// 良い例
test("投稿が存在する場合、投稿情報を返す", async () => {
  const result = await getPost();
  expect(result).toMatchObject({
    post: {
      uri: expectedUri,
    },
  });
});
```

## まとめ

良いテストケースは以下の特徴を持ちます：

1. 明確で具体的なテストケース名
2. Arrange-Act-Assertパターンの遵守
3. 適切な空行による構造化
4. 境界値とエッジケースのカバー
5. 実装に依存しない検証
6. モックの最小限の使用
7. 具体的なアサーション

これらの原則に従うことで、保守性が高く、信頼性のあるテストスイートを構築できます。
