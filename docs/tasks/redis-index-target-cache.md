# Redis移行: サブスクライバー・追跡アクター判定のキャッシュ化

## 概要

レコードインデックス時のサブスクライバー・追跡アクター判定をPostgresクエリからRedis Setに移行し、DB負荷を軽減する。

## 設計方針

- **インターフェースの分離**: 読み取り専用の`IIndexTargetQuery`とキャッシュ操作用の`IIndexTargetCache`を分離（両方Domain層に配置、継承関係なし）
- **同期戦略**: Write-Through（Postgres書き込み後にRedis更新）+ 起動時ウォームアップ
- **整合性確保**: フォロー削除時は定期リビルドで整合性確保

## Redisデータ構造

```
subscope:subscribers      # Set<Did> - サブスクライバーDID
subscope:tracked_actors   # Set<Did> - 追跡対象アクターDID
```

---

## ディレクトリ構成

```
apps/worker/src/domain/
├── index-target/           # 新規作成
│   ├── index-target-query.ts   # 読み取り専用インターフェース
│   └── index-target-cache.ts   # 書き込み操作インターフェース
└── indexing-policy/        # 既存ファイルを移動
    ├── follow-indexing-policy.ts
    ├── post-indexing-policy.ts
    ├── like-indexing-policy.ts
    ├── repost-indexing-policy.ts
    ├── profile-indexing-policy.ts
    ├── generator-indexing-policy.ts
    └── (各テストファイル)

apps/worker/src/application/
├── interfaces/repositories/
│   └── index-target-repository.ts  # データアクセス用リポジトリインターフェース
├── services/cache/
│   └── index-target-cache-sync-service.ts  # フォロー作成時の同期ロジック
└── use-cases/cache/
    └── warm-up-index-target-cache-use-case.ts  # ウォームアップロジック

apps/worker/src/infrastructure/
├── cache/
│   ├── index-target-cache.ts  # Redis実装（IIndexTargetQuery + IIndexTargetCacheを実装）
│   └── index-target-cache.in-memory.ts
└── repositories/index-target-repository/
    ├── index-target-repository.ts  # Postgres実装
    └── index-target-repository.in-memory.ts
```

---

## 作業チェックリスト

### Phase 0: ディレクトリ構成変更 ✅

- [x] `apps/worker/src/domain/indexing-policy/` ディレクトリ作成、既存の\*-indexing-policy.ts移動
- [x] `apps/worker/src/domain/index-target/` ディレクトリ作成

### Phase 1: 基盤インターフェース作成

- [x] `apps/worker/src/domain/index-target/index-target-query.ts` - 読み取り専用インターフェース作成（workerでのみ使用のため）
- [x] `apps/worker/src/domain/index-target/index-target-cache.ts` - 書き込み操作インターフェース作成（継承なし）

### Phase 2: キャッシュ実装 ✅

- [x] `pnpm add ioredis --filter @repo/worker` - 依存追加
- [x] `apps/worker/src/infrastructure/cache/index-target-cache.impl.ts` - Redis実装
- [x] `apps/worker/src/infrastructure/cache/index-target-cache.in-memory.ts` - テスト用InMemory実装

### Phase 3: リポジトリ作成

- [ ] `apps/worker/src/application/interfaces/repositories/index-target-repository.ts` - リポジトリインターフェース作成
- [ ] `apps/worker/src/infrastructure/repositories/index-target-repository/index-target-repository.ts` - Postgres実装
- [ ] `apps/worker/src/infrastructure/repositories/index-target-repository/index-target-repository.in-memory.ts` - テスト用InMemory実装

### Phase 4: ユースケース・サービス作成

- [ ] `apps/worker/src/application/use-cases/cache/warm-up-index-target-cache-use-case.ts` - ウォームアップユースケース
- [ ] `apps/worker/src/application/services/cache/index-target-cache-sync-service.ts` - 同期サービス

### Phase 5: IndexingPolicy修正

- [ ] `apps/worker/src/domain/indexing-policy/follow-indexing-policy.ts` - IIndexTargetQuery使用、TransactionContext削除
- [ ] `apps/worker/src/domain/indexing-policy/post-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/like-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/repost-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/profile-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/generator-indexing-policy.ts` - 同上

### Phase 6: Indexer修正

- [ ] `apps/worker/src/application/services/indexer/follow-indexer.ts` - IndexTargetCacheSyncService呼び出し追加
- [ ] `apps/worker/src/application/interfaces/services/index-collection-service.ts` - shouldIndexのシグネチャ変更
- [ ] 各IndexerのshouldIndexメソッド修正（TransactionContext削除）

### Phase 7: syncSubscriptionジョブ

- [ ] `packages/common/src/lib/domain/interfaces/job-queue.ts` - syncSubscriptionジョブ型追加
- [ ] `packages/common/src/lib/infrastructure/job-queue/job-queue.ts` - キュー追加
- [ ] `packages/common/src/lib/infrastructure/job-queue/job-queue.in-memory.ts` - InMemory対応
- [ ] `apps/worker/src/application/use-cases/async/sync-subscription-use-case.ts` - UseCase実装
- [ ] `apps/worker/src/presentation/worker.ts` - syncSubscriptionワーカー追加

### Phase 8: DI・起動処理

- [ ] `apps/worker/src/worker.ts` - DI設定変更（indexTargetRepository, warmUpIndexTargetCacheUseCase, indexTargetCacheSyncServiceを追加）
- [ ] `apps/worker/src/presentation/server.ts` - 起動時ウォームアップ呼び出し
- [ ] `apps/worker/src/shared/test-utils.ts` - テスト用DI設定変更

### Phase 9: appview連携

- [ ] `apps/appview/src/application/use-cases/subscribe-server-use-case.ts` - syncSubscriptionジョブ投入追加

### Phase 10: 不要コード削除

- [ ] `apps/worker/src/infrastructure/repositories/tracked-actor-checker/` - ディレクトリ削除
- [ ] `apps/worker/src/application/interfaces/repositories/tracked-actor-checker.ts` - 削除
- [ ] `packages/common/src/lib/domain/interfaces/index-target-repository.ts` - 削除
- [ ] 関連するエクスポート・インポートの整理

### Phase 11: テスト

- [ ] 既存テストの修正（InMemory実装への切り替え）
- [ ] `IndexTargetRepository`の単体テスト追加
- [ ] `WarmUpIndexTargetCacheUseCase`のテスト追加
- [ ] `IndexTargetCacheSyncService`のテスト追加
- [ ] `pnpm all` で全体確認

---

## 層の責務

| 層                     | コンポーネント                  | 責務                                               |
| ---------------------- | ------------------------------- | -------------------------------------------------- |
| Domain (worker)        | `IIndexTargetQuery`             | 追跡対象の判定（読み取り専用）                     |
| Domain (worker)        | `IIndexTargetCache`             | キャッシュ書き込み操作                             |
| Domain (worker)        | `*IndexingPolicy`               | インデックス判定ロジック                           |
| Application            | `IIndexTargetRepository`        | データアクセス用インターフェース                   |
| Application            | `WarmUpIndexTargetCacheUseCase` | キャッシュウォームアップロジック                   |
| Application            | `IndexTargetCacheSyncService`   | フォロー作成時のキャッシュ同期ロジック             |
| Application            | `*Indexer`                      | レコードのインデックス作成                         |
| Application            | `SyncSubscriptionUseCase`       | Subscription同期ジョブ処理                         |
| Infrastructure (cache) | `IndexTargetCache`              | Redis実装（IIndexTargetQuery + IIndexTargetCache） |
| Infrastructure (repo)  | `IndexTargetRepository`         | Postgres実装（IIndexTargetRepository）             |

---

## 設計詳細

### インターフェース設計

#### Domain層（キャッシュ操作）

- **IIndexTargetQuery**（worker Domain層）: 読み取り専用
  - `isSubscriber(did: Did): Promise<boolean>`
  - `hasSubscriber(dids: Did[]): Promise<boolean>`
  - `isTrackedActor(did: Did): Promise<boolean>`
  - `hasTrackedActor(dids: Did[]): Promise<boolean>`

- **IIndexTargetCache**（worker Domain層）: 書き込み操作
  - `addSubscriber(did: Did): Promise<void>`
  - `removeSubscriber(did: Did): Promise<void>`
  - `addTrackedActor(did: Did): Promise<void>`
  - `removeTrackedActor(did: Did): Promise<void>`
  - `bulkAddSubscriberDids(dids: Did[]): Promise<void>`
  - `bulkAddTrackedActorDids(dids: Did[]): Promise<void>`
  - `clear(): Promise<void>`

- 両インターフェースは継承関係を持たない。Redis実装クラスが両方を実装する
- workerアプリでのみ使用するため`packages/common`ではなく`apps/worker/src/domain/index-target/`に配置

#### Application層（データアクセス）

- **IIndexTargetRepository**: Postgresからデータ取得
  - `findAllSubscriberDids(): Promise<Did[]>`
  - `findFolloweeDids(subscriberDid: Did): Promise<Did[]>`
  - `findFollowerDid(followUri: string): Promise<Did | null>`
  - `findFolloweeDid(followUri: string): Promise<Did | null>`

### Redis操作

- `SISMEMBER` で単一DIDの存在確認
- `SMISMEMBER` で複数DIDの存在確認
- `SADD` でDID追加
- `SREM` でDID削除

### ユースケース・サービスの責務

#### WarmUpIndexTargetCacheUseCase

起動時のキャッシュウォームアップ処理:

1. `IIndexTargetCache.clear()` でキャッシュをクリア
2. `IIndexTargetRepository.findAllSubscriberDids()` で全サブスクライバーを取得
3. `IIndexTargetCache.bulkAddSubscriberDids()` でサブスクライバーを追加
4. `IIndexTargetCache.bulkAddTrackedActorDids()` でサブスクライバーをtracked_actorsにも追加
5. 各サブスクライバーに対して `IIndexTargetRepository.findFolloweeDids()` でフォロイーを取得
6. `IIndexTargetCache.bulkAddTrackedActorDids()` でフォロイーを追加

依存:

- `IIndexTargetRepository`: データ取得
- `IIndexTargetCache`: キャッシュ操作

#### IndexTargetCacheSyncService

フォロー作成時のキャッシュ同期処理:

1. `IIndexTargetRepository.findFollowerDid()` でフォロワーDIDを取得
2. `IIndexTargetQuery.isSubscriber()` でサブスクライバーか確認
3. サブスクライバーの場合、`IIndexTargetRepository.findFolloweeDid()` でフォロイーDIDを取得
4. `IIndexTargetCache.addTrackedActor()` でフォロイーを追加

依存:

- `IIndexTargetRepository`: フォロワー・フォロイーDID取得
- `IIndexTargetQuery`: サブスクライバー判定
- `IIndexTargetCache`: キャッシュ更新

**フォロー削除時**: 複雑な判定を避け、定期リビルドで整合性確保

### IndexingPolicyの変更点

- `ISubscriptionRepository`の代わりに`IIndexTargetQuery`を使用
- `TransactionContext`パラメータを削除（Redisアクセスにトランザクション不要）

---

## 関連ファイル

### 新規作成

- `apps/worker/src/application/interfaces/repositories/index-target-repository.ts` - リポジトリインターフェース
- `apps/worker/src/infrastructure/repositories/index-target-repository/index-target-repository.ts` - Postgres実装
- `apps/worker/src/infrastructure/repositories/index-target-repository/index-target-repository.in-memory.ts` - テスト用実装
- `apps/worker/src/application/use-cases/cache/warm-up-index-target-cache-use-case.ts` - ウォームアップユースケース
- `apps/worker/src/application/services/cache/index-target-cache-sync-service.ts` - 同期サービス

### 修正対象

- `apps/worker/src/domain/index-target/index-target-cache.ts` - メソッド名をDids形式に変更
- `apps/worker/src/infrastructure/cache/index-target-cache.ts` - メソッド名をDids形式に変更
- `apps/worker/src/domain/indexing-policy/*-indexing-policy.ts` - IIndexTargetQuery使用
- `apps/worker/src/application/services/indexer/*.ts` - IndexTargetCacheSyncService呼び出し追加
- `apps/worker/src/application/interfaces/services/index-collection-service.ts` - shouldIndexシグネチャ変更
- `apps/worker/src/worker.ts` - DI設定追加
- `apps/worker/src/presentation/server.ts` - ウォームアップ呼び出し追加
- `apps/worker/src/presentation/worker.ts` - syncSubscriptionワーカー追加
- `apps/worker/src/shared/test-utils.ts` - テスト用DI設定追加
- `apps/appview/src/application/use-cases/subscribe-server-use-case.ts` - syncSubscriptionジョブ投入追加

### 削除対象

- `apps/worker/src/infrastructure/repositories/tracked-actor-checker/`
- `apps/worker/src/application/interfaces/repositories/tracked-actor-checker.ts`
- `packages/common/src/lib/domain/interfaces/index-target-repository.ts`

### 参考（既存のRedis使用パターン）

- `packages/common/src/lib/infrastructure/redis-did-cache.ts`
- `packages/common/src/lib/infrastructure/job-queue/job-queue.ts`

---

## 用語定義

- **サブスクライバー**: AppViewに登録したアカウント（subscriptionsテーブルに存在）
- **追跡アクター**: サブスクライバー + サブスクライバーがフォローしているアカウント
- **インデックス対象**: 追跡アクターに関連するレコードのみDBに保存する
