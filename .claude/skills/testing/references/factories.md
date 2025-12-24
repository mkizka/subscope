# Factoryの使い方

## @repo/test-utils のFactory（データベース使用）

Repository層のテストで実DBを使用する場合に使用。

### actorFactory

```typescript
import { actorFactory } from "@repo/test-utils";

// 基本的な使い方
const actor = await actorFactory(ctx.db).create();

// カスタマイズ
const actor = await actorFactory(ctx.db)
  .vars({ handle: () => "custom.bsky.social" })
  .create();
```

### recordFactory

```typescript
import { recordFactory } from "@repo/test-utils";

// 基本的な投稿
const record = await recordFactory(ctx.db, "app.bsky.feed.post")
  .vars({
    actor: () => actor,
    text: () => "custom text",
  })
  .create();

// 複数レコードの作成
const records = await recordFactory(ctx.db, "app.bsky.feed.post").createList(5);
```

### profileFactory

```typescript
import { profileFactory } from "@repo/test-utils";

const profile = await profileFactory(ctx.db)
  .vars({
    actor: () => actor,
    displayName: () => "Test User",
  })
  .create();
```

## @repo/common/test のファクトリ関数（インメモリ）

Application/Domain層のテストでインメモリリポジトリを使用する場合。

### actorFactory（インメモリ版）

```typescript
import { actorFactory } from "@repo/common/test";

const actor = actorFactory({
  did: "did:plc:test123",
  handle: "test.bsky.social",
});
```

### profileDetailedFactory

```typescript
import { profileDetailedFactory } from "@repo/common/test";

const profile = profileDetailedFactory({
  actorDid: actor.did,
  displayName: "Test User",
  description: "Test description",
});
```

### recordFactory（インメモリ版）

```typescript
import { recordFactory } from "@repo/common/test";

const record = recordFactory({
  uri: `at://${actor.did}/app.bsky.feed.post/postkey123`,
  json: {
    $type: "app.bsky.feed.post",
    text: "test post",
    createdAt: new Date().toISOString(),
  },
});
```

## fakeCid()

CIDが必要だが実際の値は重要でない場合に使用:

```typescript
import { fakeCid } from "@repo/common/test";

const record = recordFactory({
  uri: "at://did:plc:test/app.bsky.feed.post/abc",
  cid: fakeCid(),
  json: {
    /* ... */
  },
});
```

## 使い分けガイド

- **Repository層**: `@repo/test-utils` のFactory（実DB）
- **Application層**: `@repo/common/test` のファクトリ関数（インメモリ）
- **Domain層**: `@repo/common/test` のファクトリ関数（インメモリ）
