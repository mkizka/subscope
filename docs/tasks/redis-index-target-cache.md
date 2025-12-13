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

apps/worker/src/infrastructure/cache/
├── index-target-cache.impl.ts  # Redis実装（両インターフェースを実装）
├── index-target-cache.in-memory.ts
├── index-target-cache-warmer.ts
└── index-target-cache-sync.ts
```

---

## 作業チェックリスト

### Phase 0: ディレクトリ構成変更 ✅

- [x] `apps/worker/src/domain/indexing-policy/` ディレクトリ作成、既存の\*-indexing-policy.ts移動
- [x] `apps/worker/src/domain/index-target/` ディレクトリ作成

### Phase 1: 基盤インターフェース作成

- [x] `apps/worker/src/domain/index-target/index-target-query.ts` - 読み取り専用インターフェース作成（workerでのみ使用のため）
- [x] `apps/worker/src/domain/index-target/index-target-cache.ts` - 書き込み操作インターフェース作成（継承なし）

### Phase 2: キャッシュ実装

- [ ] `pnpm add ioredis --filter @repo/worker` - 依存追加
- [ ] `apps/worker/src/infrastructure/cache/index-target-cache.impl.ts` - Redis実装
- [ ] `apps/worker/src/infrastructure/cache/index-target-cache.in-memory.ts` - テスト用InMemory実装

### Phase 3: キャッシュウォーマー・同期

- [ ] `apps/worker/src/infrastructure/cache/index-target-cache-warmer.ts` - キャッシュ再構築
- [ ] `apps/worker/src/infrastructure/cache/index-target-cache-sync.ts` - フォロー作成時の同期

### Phase 4: IndexingPolicy修正

- [ ] `apps/worker/src/domain/indexing-policy/follow-indexing-policy.ts` - IIndexTargetQuery使用、TransactionContext削除
- [ ] `apps/worker/src/domain/indexing-policy/post-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/like-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/repost-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/profile-indexing-policy.ts` - 同上
- [ ] `apps/worker/src/domain/indexing-policy/generator-indexing-policy.ts` - 同上

### Phase 5: Indexer・UseCase修正

- [ ] `apps/worker/src/application/services/indexer/follow-indexer.ts` - IndexTargetCacheSync呼び出し追加
- [ ] `apps/worker/src/application/interfaces/services/index-collection-service.ts` - shouldIndexのシグネチャ変更
- [ ] 各Indexerのshouliondexメソッド修正（TransactionContext削除）

### Phase 6: syncSubscriptionジョブ

- [ ] `packages/common/src/lib/domain/interfaces/job-queue.ts` - syncSubscriptionジョブ型追加
- [ ] `packages/common/src/lib/infrastructure/job-queue/job-queue.ts` - キュー追加
- [ ] `packages/common/src/lib/infrastructure/job-queue/job-queue.in-memory.ts` - InMemory対応
- [ ] `apps/worker/src/application/use-cases/async/sync-subscription-use-case.ts` - UseCase実装
- [ ] `apps/worker/src/presentation/worker.ts` - syncSubscriptionワーカー追加

### Phase 7: DI・起動処理

- [ ] `apps/worker/src/worker.ts` - DI設定変更（Redis実装に切り替え）
- [ ] `apps/worker/src/presentation/server.ts` - 起動時ウォームアップ呼び出し
- [ ] `apps/worker/src/shared/test-utils.ts` - テスト用DI設定変更

### Phase 8: appview連携

- [ ] `apps/appview/src/application/use-cases/subscribe-server-use-case.ts` - syncSubscriptionジョブ投入追加

### Phase 9: 不要コード削除

- [ ] `apps/worker/src/infrastructure/repositories/index-target-repository/postgres-index-target-repository.ts` - 削除
- [ ] `apps/worker/src/infrastructure/repositories/tracked-actor-checker/` - ディレクトリ削除
- [ ] `apps/worker/src/application/interfaces/repositories/tracked-actor-checker.ts` - 削除
- [ ] `packages/common/src/lib/domain/interfaces/index-target-repository.ts` - 削除
- [ ] 関連するエクスポート・インポートの整理

### Phase 10: テスト

- [ ] 既存テストの修正（InMemory実装への切り替え）
- [ ] `IndexTargetCache`の単体テスト追加
- [ ] `IndexTargetCacheWarmer`のテスト追加
- [ ] `IndexTargetCacheSync`のテスト追加
- [ ] `pnpm all` で全体確認

---

## 層の責務

| 層              | コンポーネント            | 責務                                  |
| --------------- | ------------------------- | ------------------------------------- |
| Domain (worker) | `IIndexTargetQuery`       | 追跡対象の判定（読み取り専用）        |
| Domain (worker) | `IIndexTargetCache`       | キャッシュ書き込み操作                |
| Domain (worker) | `*IndexingPolicy`         | インデックス判定ロジック              |
| Application     | `*Indexer`                | レコードのインデックス作成            |
| Application     | `SyncSubscriptionUseCase` | Subscription同期ジョブ処理            |
| Infrastructure  | `IndexTargetCache`        | Redis実装（両インターフェースを実装） |
| Infrastructure  | `IndexTargetCacheWarmer`  | キャッシュ再構築                      |
| Infrastructure  | `IndexTargetCacheSync`    | フォロー作成時のキャッシュ同期        |

---

## 設計詳細

### インターフェース分離の方針

- **IIndexTargetQuery**（worker Domain層）: 読み取り専用。`isSubscriber`, `hasSubscriber`, `isTrackedActor`, `hasTrackedActor`
- **IIndexTargetCache**（worker Domain層）: 書き込み操作。`addSubscriber`, `removeSubscriber`, `addTrackedActor`, `removeTrackedActor`, `bulkAddSubscribers`, `bulkAddTrackedActors`, `clear`
- 両インターフェースは継承関係を持たない。Redis実装クラスが両方を実装する
- workerアプリでのみ使用するため`packages/common`ではなく`apps/worker/src/domain/index-target/`に配置

### Redis操作

- `SISMEMBER` で単一DIDの存在確認
- `SMISMEMBER` で複数DIDの存在確認
- `SADD` でDID追加
- `SREM` でDID削除

### キャッシュウォーマーの処理フロー

1. キャッシュをクリア
2. subscriptionsテーブルから全サブスクライバーを取得
3. サブスクライバーをsubscribersとtracked_actorsに追加
4. 各サブスクライバーのフォロイーをfollowsテーブルから取得
5. フォロイーをtracked_actorsに追加

### キャッシュ同期の方針

- **フォロー作成時**: フォロワーがサブスクライバーの場合、フォロイーをtracked_actorsに追加
- **フォロー削除時**: 複雑な判定を避け、定期リビルドで整合性確保

### IndexingPolicyの変更点

- `ISubscriptionRepository`の代わりに`IIndexTargetQuery`を使用
- `TransactionContext`パラメータを削除（Redisアクセスにトランザクション不要）

---

## 関連ファイル

### 削除対象

- `packages/common/src/lib/domain/interfaces/index-target-repository.ts`
- `apps/worker/src/infrastructure/repositories/index-target-repository/`
- `apps/worker/src/infrastructure/repositories/tracked-actor-checker/`
- `apps/worker/src/application/interfaces/repositories/tracked-actor-checker.ts`

### 修正対象

- `apps/worker/src/domain/indexing-policy/*-indexing-policy.ts`
- `apps/worker/src/application/services/indexer/*.ts`
- `apps/worker/src/application/interfaces/services/index-collection-service.ts`
- `apps/worker/src/worker.ts`
- `apps/worker/src/presentation/server.ts`
- `apps/worker/src/presentation/worker.ts`
- `apps/worker/src/shared/test-utils.ts`
- `apps/appview/src/application/use-cases/subscribe-server-use-case.ts`

### 参考（既存のRedis使用パターン）

- `packages/common/src/lib/infrastructure/redis-did-cache.ts`
- `packages/common/src/lib/infrastructure/job-queue/job-queue.ts`

---

## 用語定義

- **サブスクライバー**: AppViewに登録したアカウント（subscriptionsテーブルに存在）
- **追跡アクター**: サブスクライバー + サブスクライバーがフォローしているアカウント
- **インデックス対象**: 追跡アクターに関連するレコードのみDBに保存する
