# テスト戦略変更計画

## 進捗チェックリスト

### Phase 0: 基盤整備

- [x] **Phase 0-A**: ドメインモデルのディレクトリ構造統一
- [x] **Phase 0-B**: ドメインモデルFactory関数の作成（基本: actor, post, profile, feedItem）
- [x] **Phase 0-C**: ドメインモデルFactory関数の作成（残り: follow, like, repost, generator）
- [x] **Phase 0-D**: appviewリポジトリのディレクトリ構造統一（Part 1: 主要リポジトリ）
- [x] **Phase 0-E**: appviewリポジトリのディレクトリ構造統一（Part 2: フィード・タイムライン系）
- [x] **Phase 0-F**: appviewリポジトリのディレクトリ構造統一（Part 3: その他）

### Phase 1: インメモリリポジトリ作成（appview）

- [x] **Phase 1-A**: インメモリリポジトリの作成（Part 1: 主要リポジトリ）
- [x] **Phase 1-B**: インメモリリポジトリの作成（Part 2: フィード・タイムライン系）
- [x] **Phase 1-C**: インメモリリポジトリの作成（Part 3: その他）

### Phase 2-6: appviewテスト移行

- [x] **Phase 2**: 最初のテスト移行（パイロット: get-author-feed-use-case）
- [x] **Phase 3-A**: appview Feed UseCaseの移行（Part 1: timeline, post-thread, search-posts）
- [x] **Phase 3-B**: appview Feed UseCaseの移行（Part 2: likes, actor-likes, reposted-by）
- [x] **Phase 4**: appview Feed/Actor Serviceの移行
- [x] **Phase 5**: appview Graph/Actor UseCaseの移行
- [x] **Phase 6-A**: appview Admin UseCaseの移行
- [x] **Phase 6-B**: appview Subscription UseCaseの移行

### Phase 7: appviewリポジトリテスト追加

- [x] **Phase 7-A**: appviewリポジトリテストの追加（Part 1）
- [x] **Phase 7-B**: appviewリポジトリテストの追加（Part 2）
- [x] **Phase 7-C**: appviewリポジトリテストの追加（Part 3）
- [x] **Phase 7-D**: appviewのVitest設定を単体テスト/統合テストに分割

### Phase 8-9: worker基盤整備

- [x] **Phase 8-A**: workerリポジトリのディレクトリ構造統一（Part 1）
- [x] **Phase 8-B**: workerリポジトリのディレクトリ構造統一（Part 2）
- [x] **Phase 8-C**: workerリポジトリのディレクトリ構造統一（Part 3）
- [x] **Phase 9-A**: workerインメモリリポジトリの作成（Part 1）
- [x] **Phase 9-B**: workerインメモリリポジトリの作成（Part 2）
- [x] **Phase 9-C**: workerインメモリリポジトリの作成（Part 3）

### Phase 10-11: workerテスト移行

- [x] **Phase 10-A**: worker Indexerの移行（follow-indexer + テスト基盤構築）
- [x] **Phase 10-B**: worker Indexerの移行（like-indexer）
- [x] **Phase 10-C**: worker Indexerの移行（post-indexer）
- [x] **Phase 10-D**: worker Indexerの移行（profile-indexer）
- [x] **Phase 10-E**: worker Indexerの移行（repost-indexer）
- [x] **Phase 11-A**: worker Serviceの移行
- [ ] **Phase 11-B**: worker UseCaseの移行（Part 1）
- [x] **Phase 11-C**: worker UseCaseの移行（Part 2）

### Phase 12: workerリポジトリテスト追加

- [ ] **Phase 12-A**: workerリポジトリテストの追加（Part 1）
- [ ] **Phase 12-B**: workerリポジトリテストの追加（Part 2）
- [ ] **Phase 12-C**: workerリポジトリテストの追加（Part 3）
- [ ] **Phase 12-D**: workerのVitest設定を単体テスト/統合テストに分割

### Phase 13: blob-proxy

- [ ] **Phase 13-A**: blob-proxyの移行
- [ ] **Phase 13-B**: blob-proxyのVitest設定を単体テスト/統合テストに分割

---

## 目標

**変更前:**

- UseCase: DockerのDBを使用した結合テスト
- リポジトリ: テストがほとんどない

**変更後:**

- UseCase: インメモリリポジトリを使用した単体テスト
- リポジトリ: DockerのDBを使用した結合テスト

---

## パッケージ構成

### Factory関数の配置場所

各ドメインモデルをディレクトリ構造に統一：

```
packages/common/src/lib/domain/
  actor/
    actor.ts
    actor.factory.ts        ← 新規追加
  post/
    post.ts
    post.factory.ts         ← 新規追加
  profile/
    profile.ts
    profile.factory.ts      ← 新規追加
  follow/
    follow.ts               ← 移動
    follow.factory.ts       ← 新規追加
  like/
    like.ts                 ← 移動
    like.factory.ts         ← 新規追加
  repost/
    repost.ts               ← 移動
    repost.factory.ts       ← 新規追加
  feed-item/
    feed-item.ts            ← 移動
    feed-item.factory.ts    ← 新規追加
  generator/
    generator.ts            ← 移動
    generator.factory.ts    ← 新規追加
```

**注意:** follow, like, repost, feed-item, generatorは現在ファイル直置き。
ディレクトリ構造に移動する際、domain.tsのエクスポートパスも更新が必要。

Factory関数は`@repo/common/domain`からエクスポート：

```
packages/common/src/lib/domain/index.ts  ← 各Factoryも再エクスポート
```

**依存関係:**

```
@repo/test-utils → @repo/common/domain （Factoryを再エクスポート可能）
             → @repo/common
             → @repo/db
```

### インメモリリポジトリの配置場所

各リポジトリをディレクトリ構造に統一：

```
apps/appview/src/infrastructure/
  post-repository/
    post-repository.ts            ← 移動
    post-repository.in-memory.ts  ← 新規追加
    post-repository.test.ts       ← 新規追加
  actor-repository/
    actor-repository.ts           ← 移動
    actor-repository.in-memory.ts ← 新規追加
    actor-repository.test.ts      ← 新規追加
  profile-repository/
    profile-repository.ts         ← 移動
    profile-repository.in-memory.ts ← 新規追加
    profile-repository.test.ts    ← 新規追加
  ...（他のリポジトリも同様）
```

**注意:** 現在すべてのリポジトリはファイル直置き。
ディレクトリ構造に移動する際、インポートパスの更新が必要。

---

## 現状のテストファイル一覧

### appview (24ファイル)

#### UseCase (14ファイル) - インメモリ化対象

| ファイル                                                   | カテゴリ |
| ---------------------------------------------------------- | -------- |
| `use-cases/feed/get-timeline-use-case.test.ts`             | Feed     |
| `use-cases/feed/get-post-thread-use-case.test.ts`          | Feed     |
| `use-cases/feed/get-author-feed-use-case.test.ts`          | Feed     |
| `use-cases/feed/get-likes-use-case.test.ts`                | Feed     |
| `use-cases/feed/get-actor-likes-use-case.test.ts`          | Feed     |
| `use-cases/feed/get-reposted-by-use-case.test.ts`          | Feed     |
| `use-cases/feed/search-posts-use-case.test.ts`             | Feed     |
| `use-cases/graph/get-followers-use-case.test.ts`           | Graph    |
| `use-cases/graph/get-follows-use-case.test.ts`             | Graph    |
| `use-cases/actor/search-actors-use-case.test.ts`           | Actor    |
| `use-cases/actor/search-actors-typeahead-use-case.test.ts` | Actor    |
| `use-cases/admin/create-invite-code-use-case.test.ts`      | Admin    |
| `use-cases/admin/get-subscribers-use-case.test.ts`         | Admin    |
| `use-cases/admin/get-invite-codes-use-case.test.ts`        | Admin    |

#### Service (4ファイル) - インメモリ化対象

| ファイル                                     | カテゴリ |
| -------------------------------------------- | -------- |
| `service/feed/feed-processor.test.ts`        | Feed     |
| `service/feed/reply-ref-service.test.ts`     | Feed     |
| `service/feed/post-view-service.test.ts`     | Feed     |
| `service/actor/profile-view-service.test.ts` | Actor    |

#### その他 (6ファイル)

| ファイル                                       | 対応方針                   |
| ---------------------------------------------- | -------------------------- |
| `get-subscription-status-use-case.test.ts`     | インメモリ化対象           |
| `subscribe-server-use-case.test.ts`            | インメモリ化対象           |
| `unsubscribe-server-use-case.test.ts`          | インメモリ化対象           |
| `infrastructure/post-stats-repository.test.ts` | DBテスト（既存維持）       |
| `infrastructure/repost-repository.test.ts`     | DBテスト（既存維持）       |
| `domain/service/at-uri-service.test.ts`        | ドメインテスト（変更不要） |

### worker (18ファイル)

#### UseCase/Service (11ファイル) - インメモリ化対象

| ファイル                                              | カテゴリ |
| ----------------------------------------------------- | -------- |
| `use-cases/commit/index-commit-use-case.test.ts`      | Commit   |
| `use-cases/account/handle-account-use-case.test.ts`   | Account  |
| `use-cases/async/resolve-did-use-case.test.ts`        | Async    |
| `use-cases/async/sync-repo-use-case.test.ts`          | Async    |
| `use-cases/identity/upsert-identity-use-case.test.ts` | Identity |
| `services/index-actor-service.test.ts`                | Service  |
| `services/index-record-service.test.ts`               | Service  |
| `services/indexer/follow-indexer.test.ts`             | Indexer  |
| `services/indexer/like-indexer.test.ts`               | Indexer  |
| `services/indexer/post-indexer.test.ts`               | Indexer  |
| `services/indexer/profile-indexer.test.ts`            | Indexer  |
| `services/indexer/repost-indexer.test.ts`             | Indexer  |

#### Domain (6ファイル) - 変更不要

| ファイル                                   |
| ------------------------------------------ |
| `domain/follow-indexing-policy.test.ts`    |
| `domain/post-indexing-policy.test.ts`      |
| `domain/repost-indexing-policy.test.ts`    |
| `domain/generator-indexing-policy.test.ts` |
| `domain/like-indexing-policy.test.ts`      |
| `domain/profile-indexing-policy.test.ts`   |

#### Infrastructure (2ファイル) - 変更不要

| ファイル                                       |
| ---------------------------------------------- |
| `infrastructure/fetchers/repo-fetcher.test.ts` |
| `infrastructure/utils/data-sanitizer.test.ts`  |

### blob-proxy (1ファイル)

| ファイル                                   | 対応方針         |
| ------------------------------------------ | ---------------- |
| `application/image-proxy-use-case.test.ts` | インメモリ化対象 |

---

## 実装計画

### Phase 0-A: ドメインモデルのディレクトリ構造統一

**対象（packages/common/src/lib/domain/）:**

```
follow.ts     → follow/follow.ts
like.ts       → like/like.ts
repost.ts     → repost/repost.ts
feed-item.ts  → feed-item/feed-item.ts
generator.ts  → generator/generator.ts
```

**必要な変更:**

- 各ファイルの移動（5ファイル）
- `packages/common/src/lib/domain/index.ts` のエクスポートパス更新

---

### Phase 0-B: ドメインモデルFactory関数の作成（基本）

**対象Factory（4個）:**

- `actorFactory()` - Actor
- `postFactory()` - Post
- `profileFactory()` - Profile
- `feedItemFactory()` - FeedItem

**必要な変更:**

- 各ドメインモデルディレクトリ内にFactory関数を追加
- `packages/common/src/lib/domain/index.ts` にエクスポート追加
- `packages/common/package.json` に `@faker-js/faker` を devDependencies に追加

---

### Phase 0-C: ドメインモデルFactory関数の作成（残り）

**対象Factory（4個）:**

- `followFactory()` - Follow
- `likeFactory()` - Like
- `repostFactory()` - Repost
- `generatorFactory()` - Generator

---

### Phase 0-D: appviewリポジトリのディレクトリ構造統一（Part 1: 主要リポジトリ）

**対象（apps/appview/src/infrastructure/）:**

```
post-repository.ts        → post-repository/post-repository.ts
actor-repository.ts       → actor-repository/actor-repository.ts
profile-repository.ts     → profile-repository/profile-repository.ts
follow-repository.ts      → follow-repository/follow-repository.ts
like-repository.ts        → like-repository/like-repository.ts
repost-repository.ts      → repost-repository/repost-repository.ts
```

**必要な変更:**

- 6ファイルの移動
- 既存テスト（repost-repository.test.ts）も移動
- インポートパスの更新

---

### Phase 0-E: appviewリポジトリのディレクトリ構造統一（Part 2: フィード・タイムライン系）

**対象（apps/appview/src/infrastructure/）:**

```
timeline-repository.ts     → timeline-repository/timeline-repository.ts
author-feed-repository.ts  → author-feed-repository/author-feed-repository.ts
post-stats-repository.ts   → post-stats-repository/post-stats-repository.ts
actor-stats-repository.ts  → actor-stats-repository/actor-stats-repository.ts
record-repository.ts       → record-repository/record-repository.ts
generator-repository.ts    → generator-repository/generator-repository.ts
```

**必要な変更:**

- 6ファイルの移動
- 既存テスト（post-stats-repository.test.ts）も移動
- インポートパスの更新

---

### Phase 0-F: appviewリポジトリのディレクトリ構造統一（Part 3: その他）

**対象（apps/appview/src/infrastructure/）:**

```
subscription-repository.ts → subscription-repository/subscription-repository.ts
invite-code-repository.ts  → invite-code-repository/invite-code-repository.ts
handle-resolver.ts         → handle-resolver/handle-resolver.ts
token-verifier.ts          → token-verifier/token-verifier.ts
asset-url-builder.ts       → asset-url-builder/asset-url-builder.ts
```

**必要な変更:**

- 5ファイルの移動
- インポートパスの更新

---

### Phase 1-A: インメモリリポジトリの作成（Part 1: 主要リポジトリ）

**対象インメモリリポジトリ（5個）:**

- InMemoryPostRepository
- InMemoryActorRepository
- InMemoryProfileRepository
- InMemoryRecordRepository
- InMemoryHandleResolver

---

### Phase 1-B: インメモリリポジトリの作成（Part 2: フィード・タイムライン系）

**対象インメモリリポジトリ（5個）:**

- InMemoryAuthorFeedRepository
- InMemoryPostStatsRepository
- InMemoryActorStatsRepository
- InMemoryFollowRepository
- InMemoryGeneratorRepository

---

### Phase 1-C: インメモリリポジトリの作成（Part 3: その他）

**対象インメモリリポジトリ（4個）:**

- InMemoryRepostRepository
- InMemoryLikeRepository
- InMemoryTimelineRepository
- InMemoryAssetUrlBuilder

---

### Phase 2: 最初のテスト移行（パイロット）

**対象ファイル (1個):**

1. `get-author-feed-use-case.test.ts` - 特定アカウントの投稿一覧を取得するユースケース

**選定理由:**

- Timeline/PostThreadに比べて複雑なリレーション処理が少ない
- スレッド構造などの再帰的な処理がない

---

### Phase 3-A: appview Feed UseCaseの移行（Part 1）

**対象ファイル (3個):**

1. `get-timeline-use-case.test.ts`
2. `get-post-thread-use-case.test.ts`
3. `search-posts-use-case.test.ts`

---

### Phase 3-B: appview Feed UseCaseの移行（Part 2）

**対象ファイル (3個):**

1. `get-likes-use-case.test.ts`
2. `get-actor-likes-use-case.test.ts`
3. `get-reposted-by-use-case.test.ts`

---

### Phase 4: appview Feed/Actor Serviceの移行

**対象ファイル (4個):**

1. `service/feed/feed-processor.test.ts`
2. `service/feed/reply-ref-service.test.ts`
3. `service/feed/post-view-service.test.ts`
4. `service/actor/profile-view-service.test.ts`

---

### Phase 5: appview Graph/Actor UseCaseの移行

**対象ファイル (4個):**

1. `use-cases/graph/get-followers-use-case.test.ts`
2. `use-cases/graph/get-follows-use-case.test.ts`
3. `use-cases/actor/search-actors-use-case.test.ts`
4. `use-cases/actor/search-actors-typeahead-use-case.test.ts`

---

### Phase 6-A: appview Admin UseCaseの移行

**対象ファイル (3個):**

1. `use-cases/admin/create-invite-code-use-case.test.ts`
2. `use-cases/admin/get-subscribers-use-case.test.ts`
3. `use-cases/admin/get-invite-codes-use-case.test.ts`

**追加で必要なインメモリリポジトリ:**

- InMemorySubscriptionRepository
- InMemoryInviteCodeRepository

---

### Phase 6-B: appview Subscription UseCaseの移行

**対象ファイル (3個):**

1. `get-subscription-status-use-case.test.ts`
2. `subscribe-server-use-case.test.ts`
3. `unsubscribe-server-use-case.test.ts`

---

### Phase 7-A: appviewリポジトリテストの追加（Part 1）

**新規追加対象（4個）:**

- `post-repository/post-repository.test.ts`
- `actor-repository/actor-repository.test.ts`
- `profile-repository/profile-repository.test.ts`
- `follow-repository/follow-repository.test.ts`

---

### Phase 7-B: appviewリポジトリテストの追加（Part 2）

**新規追加対象（4個）:**

- `like-repository/like-repository.test.ts`
- `timeline-repository/timeline-repository.test.ts`
- `author-feed-repository/author-feed-repository.test.ts`
- `actor-stats-repository/actor-stats-repository.test.ts`

---

### Phase 7-C: appviewリポジトリテストの追加（Part 3）

**新規追加対象（4個）:**

- `generator-repository/generator-repository.test.ts`
- `record-repository/record-repository.test.ts`
- `subscription-repository/subscription-repository.test.ts`
- `invite-code-repository/invite-code-repository.test.ts`

---

### Phase 7-D: Vitest設定の分割

**ルートの共通設定:**

```
vitest.unit.shared.ts        # 単体テスト共通設定
vitest.integration.shared.ts # 統合テスト共通設定
```

**単体テスト共通設定 (vitest.unit.shared.ts):**

```typescript
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    setupFiles: "./vitest.unit.setup.ts",
    include: ["./src/{application,domain,presentation}/**/*.test.ts"],
    clearMocks: true,
    sequence: { groupOrder: 1 },
  },
});
```

**統合テスト共通設定 (vitest.integration.shared.ts):**

```typescript
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globalSetup: "./vitest.integration.global-setup.ts",
    setupFiles: "./vitest.integration.setup.ts",
    include: ["src/infrastructure/**/*.test.ts"],
    testTimeout: 120000, // 2 min
    clearMocks: true,
    isolate: false,
    maxWorkers: 1,
    sequence: { groupOrder: 2 },
  },
});
```

**appviewの構成（完了）:**

```
apps/appview/
  vitest.config.ts                 # projectsで unit/integration を参照
  vitest.unit.config.ts            # mergeConfig(sharedConfig, ...)
  vitest.unit.setup.ts             # インメモリリポジトリのクリア
  vitest.integration.config.ts     # mergeConfig(sharedConfig, ...)
  vitest.integration.setup.ts      # DBリセット
  vitest.integration.global-setup.ts  # DB起動
```

**workerの構成（完了）:**

```
apps/worker/
  vitest.config.ts                 # projectsで unit/integration を参照
  vitest.unit.config.ts            # mergeConfig(sharedConfig, ...) + 移行済みテストのinclude
  vitest.unit.setup.ts             # インメモリリポジトリのクリア
  vitest.integration.config.ts     # mergeConfig(sharedConfig, ...) + 移行済みテストのexclude
  vitest.integration.setup.ts      # DBリセット
  vitest.integration.global-setup.ts  # DB起動
```

**各アプリの設定例:**

```typescript
// apps/appview/vitest.unit.config.ts
import { defineProject, mergeConfig } from "vitest/config";
import sharedConfig from "../../vitest.unit.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "appview:unit",
      // includeはsharedConfigから継承
    },
  }),
);
```

```typescript
// apps/appview/vitest.integration.config.ts
import { defineProject, mergeConfig } from "vitest/config";
import sharedConfig from "../../vitest.integration.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "appview:integration",
      // includeはsharedConfigから継承
    },
  }),
);
```

---

### Phase 8-A: workerリポジトリのディレクトリ構造統一（Part 1）

**対象（apps/worker/src/infrastructure/repositories/）:**

```
post-repository.ts        → post-repository/post-repository.ts
actor-repository.ts       → actor-repository/actor-repository.ts
profile-repository.ts     → profile-repository/profile-repository.ts
follow-repository.ts      → follow-repository/follow-repository.ts
like-repository.ts        → like-repository/like-repository.ts
```

---

### Phase 8-B: workerリポジトリのディレクトリ構造統一（Part 2）

**対象（apps/worker/src/infrastructure/repositories/）:**

```
repost-repository.ts      → repost-repository/repost-repository.ts
record-repository.ts      → record-repository/record-repository.ts
post-stats-repository.ts  → post-stats-repository/post-stats-repository.ts
actor-stats-repository.ts → actor-stats-repository/actor-stats-repository.ts
feed-item-repository.ts   → feed-item-repository/feed-item-repository.ts
```

---

### Phase 8-C: workerリポジトリのディレクトリ構造統一（Part 3）

**対象（apps/worker/src/infrastructure/repositories/）:**

```
generator-repository.ts            → generator-repository/generator-repository.ts
subscription-repository.ts         → subscription-repository/subscription-repository.ts
invite-code-repository.ts          → invite-code-repository/invite-code-repository.ts
postgres-index-target-repository.ts → index-target-repository/postgres-index-target-repository.ts
tracked-actor-checker.ts           → tracked-actor-checker/tracked-actor-checker.ts
```

---

### Phase 9-A: workerインメモリリポジトリの作成（Part 1）

**対象インメモリリポジトリ（5個）:**

- InMemoryPostRepository (worker用)
- InMemoryActorRepository (worker用)
- InMemoryProfileRepository (worker用)
- InMemoryFollowRepository (worker用)
- InMemoryLikeRepository (worker用)

---

### Phase 9-B: workerインメモリリポジトリの作成（Part 2）

**対象インメモリリポジトリ（5個）:**

- InMemoryRepostRepository (worker用)
- InMemoryRecordRepository (worker用)
- InMemoryPostStatsRepository (worker用)
- InMemoryActorStatsRepository (worker用)
- InMemoryFeedItemRepository (worker用)

---

### Phase 9-C: workerインメモリリポジトリの作成（Part 3）

**対象インメモリリポジトリ（5個）:**

- InMemoryGeneratorRepository (worker用)
- InMemorySubscriptionRepository (worker用)
- InMemoryInviteCodeRepository (worker用)
- InMemoryIndexTargetRepository (worker用)
- InMemoryTrackedActorChecker (worker用)

---

### Phase 10-A: worker Indexerの移行（follow-indexer + テスト基盤構築）

**対象ファイル:**

1. `services/indexer/follow-indexer.test.ts`

**テスト基盤構築作業:**

- `apps/worker/src/shared/test-utils.ts` の作成
  - testInjectorのセットアップ
  - setupFiles()関数の作成
- `packages/common/src/lib/test/job-queue.in-memory.ts` の作成
  - InMemoryJobQueueの実装
- Vitest設定ファイルの作成:
  - `apps/worker/vitest.unit.config.ts`
  - `apps/worker/vitest.unit.setup.ts`
  - `apps/worker/vitest.integration.config.ts`
  - `apps/worker/vitest.integration.setup.ts`
  - `apps/worker/vitest.integration.global-setup.ts`
- ルート`vitest.config.ts`の更新

**実装内容:**

- mockAggregateActorStatsSchedulerを削除し、本物のAggregateActorStatsSchedulerを使用
- mockJobQueueを削除し、InMemoryJobQueueを使用
- createCtx関数を削除し、testInjectorから直接ctxを取得
- InMemoryFollowRepository.findByUri()メソッドの追加
- InMemoryIndexTargetRepository.clear()をsyncに変更
- InMemoryTrackedActorCheckerから不要なclearメソッドを削除

**移行期間中のvitest設定:**

workerの移行期間中は、`mergeConfig`を使用してshared設定を継承しつつ、移行済みテストを個別に指定します：

```typescript
// vitest.unit.config.ts（移行期間中）
import { defineProject, mergeConfig } from "vitest/config";
import sharedConfig from "../../vitest.unit.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "worker:unit",
      // sharedConfigのincludeを上書きして、移行済みテストのみを指定
      include: [
        "./src/application/services/indexer/follow-indexer.test.ts",
        // 移行済みテストを順次追加
      ],
    },
  }),
);

// vitest.integration.config.ts（移行期間中）
import { defineProject, mergeConfig } from "vitest/config";
import sharedConfig from "../../vitest.integration.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "worker:integration",
      // sharedConfigのincludeを上書きして、未移行テストも含める
      include: [
        "src/infrastructure/**/*.test.ts",
        "src/{application,domain,presentation}/**/*.test.ts",
      ],
      // 移行済みテストを除外
      exclude: [
        "src/application/services/indexer/follow-indexer.test.ts",
        // 移行済みテストを順次追加
      ],
    },
  }),
);
```

**移行手順:**

1. テストをインメモリリポジトリに移行
2. `vitest.unit.config.ts`のincludeに追加
3. `vitest.integration.config.ts`のexcludeに追加

**移行完了後:**

すべてのテストの移行が完了したら、include/excludeを削除してsharedConfigから継承：

```typescript
// vitest.unit.config.ts
// includeはsharedConfigから継承（./src/{application,domain,presentation}/**/*.test.ts）

// vitest.integration.config.ts
// includeはsharedConfigから継承（src/infrastructure/**/*.test.ts）
// excludeは削除
```

---

### Phase 11-A: worker Serviceの移行

**対象ファイル (2個):**

1. `services/index-actor-service.test.ts`
2. `services/index-record-service.test.ts`

---

### Phase 11-B: worker UseCaseの移行（Part 1）

**対象ファイル (3個):**

1. `use-cases/commit/index-commit-use-case.test.ts`
2. `use-cases/account/handle-account-use-case.test.ts`
3. `use-cases/identity/upsert-identity-use-case.test.ts`

---

### Phase 11-C: worker UseCaseの移行（Part 2）

**対象ファイル (2個):**

1. `use-cases/async/resolve-did-use-case.test.ts`
2. `use-cases/async/sync-repo-use-case.test.ts`

---

### Phase 12-A: workerリポジトリテストの追加（Part 1）

**新規追加対象（5個）:**

- `repositories/post-repository/post-repository.test.ts`
- `repositories/actor-repository/actor-repository.test.ts`
- `repositories/profile-repository/profile-repository.test.ts`
- `repositories/follow-repository/follow-repository.test.ts`
- `repositories/like-repository/like-repository.test.ts`

---

### Phase 12-B: workerリポジトリテストの追加（Part 2）

**新規追加対象（5個）:**

- `repositories/repost-repository/repost-repository.test.ts`
- `repositories/record-repository/record-repository.test.ts`
- `repositories/post-stats-repository/post-stats-repository.test.ts`
- `repositories/actor-stats-repository/actor-stats-repository.test.ts`
- `repositories/feed-item-repository/feed-item-repository.test.ts`

---

### Phase 12-C: workerリポジトリテストの追加（Part 3）

**新規追加対象（5個）:**

- `repositories/generator-repository/generator-repository.test.ts`
- `repositories/subscription-repository/subscription-repository.test.ts`
- `repositories/invite-code-repository/invite-code-repository.test.ts`
- `repositories/index-target-repository/index-target-repository.test.ts`
- `repositories/tracked-actor-checker/tracked-actor-checker.test.ts`

---

### Phase 13: blob-proxyの移行

**対象ファイル (1個):**

1. `application/image-proxy-use-case.test.ts`

---

## 技術的詳細

### Factory関数の実装パターン

```typescript
// packages/common/src/lib/domain/post/post.factory.ts
import { Post, type PostParams } from "./post.js";
import { faker } from "@faker-js/faker";

/**
 * Postドメインモデルのテスト用Factory関数
 * デフォルト値に対してパラメータを上書きして生成
 */
export function postFactory(params: Partial<PostParams> = {}): Post {
  const defaultParams: PostParams = {
    uri: `at://did:plc:${faker.string.alphanumeric(24)}/app.bsky.feed.post/${faker.string.alphanumeric(13)}`,
    cid: faker.string.alphanumeric(50),
    actorDid: `did:plc:${faker.string.alphanumeric(24)}`,
    text: faker.lorem.sentence(),
    replyRoot: null,
    replyParent: null,
    langs: [],
    embed: null,
    createdAt: faker.date.recent(),
    indexedAt: faker.date.recent(),
  };

  return new Post({
    ...defaultParams,
    ...params,
  });
}
```

**使用例:**

```typescript
// デフォルト値で生成
const post = postFactory();

// 一部の値を上書き
const customPost = postFactory({
  text: "カスタムテキスト",
  actorDid: "did:plc:specific123",
});

// 複数の値を上書き
const replyPost = postFactory({
  replyRoot: { uri: rootUri, cid: rootCid },
  replyParent: { uri: parentUri, cid: parentCid },
  actorDid: actor.did,
});
```

### インメモリリポジトリの実装パターン

```typescript
// apps/appview/src/infrastructure/post-repository.in-memory.ts
import type { IPostRepository } from "../application/interfaces/post-repository.js";
import type { Post } from "@repo/common/domain";
import type { AtUri } from "@atproto/syntax";

export class InMemoryPostRepository implements IPostRepository {
  private posts: Map<string, Post> = new Map();

  // テストヘルパー
  add(post: Post): void {
    this.posts.set(post.uri.toString(), post);
  }

  clear(): void {
    this.posts.clear();
  }

  // IPostRepositoryの実装
  async findByUri(uri: AtUri): Promise<Post | null> {
    return this.posts.get(uri.toString()) ?? null;
  }

  // 必要に応じて他のメソッドを実装
}
```

### 移行後のテストパターン

**重要: Factory関数のインポート元**

- ドメインモデル（Post, Actor等）: `@repo/common/domain`からインポート
- Factory関数（postFactory, actorFactory等）: `@repo/common/test`からインポート

**重要: Factory関数の引数最小化**

Factory関数のすべての引数はオプショナルであり、デフォルト値が提供されています。
テストコードでは、**必要な引数のみを指定**し、不要な引数は削除してください。

以下の場合のみ引数を指定します：

- **アサーションで検証する値**（例: `displayName`, `text`, `likeCount`）
- **オブジェクト間の関係を定義する値**（例: `actorDid`, `subjectUri`, `replyRoot`）
- **テストの順序保証に必要な値**（例: カーソルテストの`createdAt`）

以下の場合は引数を削除します：

- アサーションで使用されない値（例: 結果に含まれない投稿の`text`）
- デフォルト値で問題ない識別子（例: 特定の値が不要な`did`, `handle`）
- テストロジックに影響しない値（例: 順序が関係ない場合の`createdAt`）

**悪い例（不要な引数が多い）:**

```typescript
const author = actorFactory({
  did: "did:plc:author123", // 不要（アサーションで使用しない）
  handle: "author.test", // 不要（アサーションで使用しない）
});

const profile = profileDetailedFactory({
  actorDid: author.did, // 必要（関係性）
  displayName: "Author User", // 必要（アサーション）
  handle: "author.test", // 不要（アサーションで使用しない）
});

const post = postFactory({
  actorDid: author.did, // 必要（関係性）
  text: "Post that won't appear", // 不要（結果に含まれない）
  createdAt: new Date("2024-01-01T00:00:00Z"), // 不要（順序が関係ない）
});
```

**良い例（必要最小限の引数のみ）:**

```typescript
const author = actorFactory();

const profile = profileDetailedFactory({
  actorDid: author.did, // 必要（関係性）
  displayName: "Author User", // 必要（アサーション）
});

const post = postFactory({
  actorDid: author.did, // 必要（関係性）
});
```

**重要: postFactoryの戻り値**

`postFactory`は`{post, record}`のオブジェクトを返します。PostViewServiceがrecordRepositoryを使用するため、テストでは両方をリポジトリに追加する必要があります。

```typescript
// postFactoryの使い方
const { post, record } = postFactory({
  actorDid: author.did,
  text: "Test post",
});
postRepo.add(post);
recordRepo.add(record); // recordも追加が必要

// recordRepoの取得と初期化も忘れずに
const recordRepo = injector.resolve("recordRepository");

beforeEach(() => {
  postRepo.clear();
  recordRepo.clear(); // recordRepoもクリア
});
```

**単体テストの実行方法**

単体テスト（インメモリリポジトリを使用したテスト）は、以下のコマンドで実行できます。

```bash
# ユニットテストのみ実行（全パッケージの型チェック・フォーマット + worker:unit・appview:unit）
pnpm all:unit
```

**動作確認時のコマンド:**

Phase移行後の動作確認には `pnpm all:unit` を使用してください。このコマンドは：

- 全パッケージの型チェック（`turbo run typecheck`）
- 全パッケージのフォーマットチェック（`turbo run format`）
- worker:unitプロジェクトの単体テスト
- appview:unitプロジェクトの単体テスト

を実行します。Docker環境を必要とせず、インメモリリポジトリのみを使用するため高速に実行できます。

---

## 重要なファイル

### 参照が必要なファイル

- [factory.ts](packages/test-utils/src/factory.ts) - 既存ファクトリの参考（ビルダー設計の参考）
- [setup.ts](packages/test-utils/src/setup.ts) - テストセットアップ
- リポジトリインターフェース（各アプリのapplication/interfaces/配下）
- ドメインモデル（packages/common/src/lib/domain/配下）
- **重要**: Factory関数は `packages/common/src/test.ts` からエクスポートされる

### 新規作成が必要なファイル

- `packages/common/src/lib/domain/*/*.factory.ts` - 各ドメインモデルのFactory関数
- `apps/appview/src/infrastructure/*-repository/*.in-memory.ts` - インメモリリポジトリ
- `apps/worker/src/infrastructure/repositories/*-repository/*.in-memory.ts` - インメモリリポジトリ

### 変更が必要なファイル

- `packages/common/src/test.ts` - Factory関数のエクスポート追加（**domainではなくtest**）
- `packages/common/package.json` - devDependencies に "@faker-js/faker" を追加（既に追加済み）

---

## 期待される効果

1. **テスト実行時間の短縮**
   - Dockerコンテナ起動不要（UseCase/Serviceテスト）
   - DBリセット不要

2. **テスト作成コストの削減**
   - Factory関数による簡潔なテストデータ生成
   - DBスキーマを意識しないテスト

3. **テストの信頼性向上**
   - リポジトリ層のDBテストにより、クエリの正確性を保証
   - UseCase層はビジネスロジックに集中
