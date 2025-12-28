# フォロー削除時にTapから情報を削除する実装計画

## 概要

サブスクライバーがフォローを削除した際に、他のサブスクライバーからフォローされていないフォロイーをTapから削除する機能を実装する。

## 現状

- **Tap登録**：サブスクライバーがフォローした時に、フォロイーのDIDが`tapClient.addRepo()`で登録される
- **Tap削除**：フォロー削除時にTapから削除する処理が**存在しない**
- `@atproto/tap`ライブラリには`removeRepos(dids: string[])`メソッドが存在する

## 削除条件

フォロー削除時、以下の条件を満たす場合のみTapから削除する：

1. フォロワーがサブスクライバーである
2. フォロイーが他のサブスクライバーからフォローされていない

## 実装ステップ

### 1. ITapClientインターフェースに`removeRepo`メソッドを追加

**ファイル**: `packages/common/src/lib/domain/interfaces/tap-client.ts`

```typescript
export interface ITapClient {
  addRepo: (did: Did) => Promise<void>;
  removeRepo: (did: Did) => Promise<void>; // 追加
}
```

### 2. TapClient実装に`removeRepo`メソッドを追加

**ファイル**: `packages/common/src/lib/infrastructure/tap-client/tap-client.ts`

```typescript
async removeRepo(did: Did): Promise<void> {
  await this.tap.removeRepos([did]);
}
```

### 3. IFollowRepositoryに`isFollowedByAnySubscriber`メソッドを追加

**ファイル**: `apps/worker/src/application/interfaces/repositories/follow-repository.ts`

```typescript
export interface IFollowRepository {
  upsert: (...) => Promise<void>;
  isFollowedByAnySubscriber: (params: {
    ctx: TransactionContext;
    subjectDid: string;
  }) => Promise<boolean>;  // 追加
}
```

### 4. FollowRepository実装に`isFollowedByAnySubscriber`メソッドを追加

**ファイル**: `apps/worker/src/infrastructure/repositories/follow-repository/follow-repository.ts`

followsテーブルとsubscriptionsテーブルをJOINして、subjectDidが他のサブスクライバーからフォローされているかを確認するクエリを実装する。

### 5. FollowIndexerの`afterAction`を拡張

**ファイル**: `apps/worker/src/application/services/indexer/follow-indexer.ts`

`afterAction`メソッドに`action`パラメータを追加し、`delete`の場合にTap削除ロジックを実行：

```typescript
async afterAction({
  ctx,
  record,
  action,
}: {
  ctx: TransactionContext;
  record: Record;
  action: "upsert" | "delete";
}): Promise<void> {
  const follow = Follow.from(record);

  // 既存の統計集計処理
  await this.aggregateActorStatsScheduler.schedule(follow.actorDid, "follows");
  await this.aggregateActorStatsScheduler.schedule(follow.subjectDid, "followers");

  // 削除時のTap削除処理を追加
  if (action === "delete") {
    const isFollowerSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      follow.actorDid,
    );
    if (isFollowerSubscriber) {
      const isStillFollowed = await this.followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: follow.subjectDid,
      });
      if (!isStillFollowed) {
        await this.tapClient.removeRepo(follow.subjectDid);
      }
    }
  }
}
```

### 6. テストを追加

**ファイル**: `apps/worker/src/application/services/indexer/follow-indexer.test.ts`

以下のテストケースを追加：

- フォロー削除時、フォロワーがサブスクライバーで他のサブスクライバーからフォローされていない場合、Tapから削除される
- フォロー削除時、フォロワーがサブスクライバーでも他のサブスクライバーからフォローされている場合、Tapから削除されない
- フォロー削除時、フォロワーがサブスクライバーでない場合、Tap削除処理は実行されない

## 修正対象ファイル一覧

1. `packages/common/src/lib/domain/interfaces/tap-client.ts` - `removeRepo`追加
2. `packages/common/src/lib/infrastructure/tap-client/tap-client.ts` - `removeRepo`実装
3. `packages/common/src/lib/infrastructure/tap-client/tap-client.test.ts` - テスト追加
4. `apps/worker/src/application/interfaces/repositories/follow-repository.ts` - `isFollowedByAnySubscriber`追加
5. `apps/worker/src/infrastructure/repositories/follow-repository/follow-repository.ts` - 実装追加
6. `apps/worker/src/application/services/indexer/follow-indexer.ts` - 削除時ロジック追加
7. `apps/worker/src/application/services/indexer/follow-indexer.test.ts` - テスト追加
8. `packages/common/src/lib/infrastructure/tap-client/tap-client.in-memory.ts` - `removeRepo`追加
9. `apps/worker/src/infrastructure/repositories/follow-repository/follow-repository.in-memory.ts` - `isFollowedByAnySubscriber`追加
