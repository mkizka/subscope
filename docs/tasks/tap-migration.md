# Tap移行タスクリスト

Jetstreamから@atproto/tapへの移行に伴う実装タスク

## 概要

### 背景

これまでJetstreamを使用してFirehoseからイベントを受信し、AppView側でレコードのインデックスポリシー（条件分岐）を実装して必要なレコードのみを保存していた。Tapへの移行により、以下の変更が発生する：

1. **イベント配信の仕組み変更**: Jetstream → Tap
2. **フィルタリングの責務移譲**: AppView側の条件分岐 → Tap側のDID登録
3. **バックフィルの自動化**: 手動PDS取得 → Tapの自動バックフィル

### Tapとは

- AT Protocolのリレーとアプリケーション間に位置するフィルタリングサービス
- 登録されたDIDのアカウントに関するイベントのみをAppViewに送信
- 公式ドキュメント: https://docs.bsky.app/blog/introducing-tap

### Tapの主な機能

- **自動バックフィル**: 新しいDIDを登録すると、そのアカウントの完全な履歴を取得してから最新イベントを配信
- **検証と復旧**: 暗号化検証を処理し、リポジトリが非同期化した場合は自動的に再同期
- **配信保証**: 最低1回（at least once）の配信保証とリポジトリごとの順序保証

### 現在の実装状況

- ✅ Tapへの接続実装済み（[apps/ingester/src/presentation/tap.ts](../../apps/ingester/src/presentation/tap.ts)）
- ✅ Tapからのイベント受信実装済み
- ❌ Tapへのアカウント登録機能は未実装
- ❌ レコードインデックスポリシーの条件分岐は残存

## 関連ドキュメント

- [レコードのインデックス仕様](../specs/record-indexing.md) - 更新済みの仕様書
- [Tap公式ドキュメント](https://docs.bsky.app/blog/introducing-tap)
- [テストケースの書き方](../dev/testing.md)
- [プロジェクトCLAUDE.md](../../CLAUDE.md) - プロジェクト全体の指針

## 1. Tapへのアカウント登録機能を実装

**目的**: Tapの`repos/add`エンドポイントを呼び出してDIDを登録する機能を実装する

**実装場所**:

- インターフェース: `packages/common/domain/src/infrastructure/tap-client.ts`
- 実装: `packages/common/infrastructure/src/tap-client.ts`
- テスト: `packages/common/infrastructure/src/tap-client.test.ts`

**タスク**:

- [x] ITapClientインターフェースを定義（domain層）
  ```typescript
  export interface ITapClient {
    addRepo(did: Did): Promise<void>;
  }
  ```
- [x] TapClientクラスを作成（infrastructure層）
  - [x] `repos/add`エンドポイントを呼び出すメソッド
  - [x] エラーハンドリングとリトライ処理
  - [x] 環境変数からTapのURLを取得（`TAP_URL`）
- [x] TapClientのユニットテストを作成
  - [x] addRepo成功ケース
  - [x] ネットワークエラーのケース
  - [x] HTTPエラーのケース

**参考**:

- 現在のTap接続実装: [apps/ingester/src/presentation/tap.ts](../../apps/ingester/src/presentation/tap.ts)
- Tap公式ドキュメント: https://docs.bsky.app/blog/introducing-tap

## 2. サブスクライバー登録時にTapへDIDを登録

**目的**: サブスクライバーが新規登録された際に、そのDIDをTapに登録する

**実装場所**:

- `apps/appview/src/application/subscribe-server-use-case.ts` または関連ドメインサービス
- テスト: 対応するテストファイル

**タスク**:

- [x] SubscribeServerUseCaseまたは関連ドメインサービスにTap登録処理を追加
  - [x] tapClientを依存性注入
  - [x] サブスクライバー作成後、そのDIDをTapに登録
  - [x] ~~Tap登録失敗時のエラーハンドリング（ログ記録＋継続）~~ → エラーハンドリング不要（失敗時は例外を投げる設計に変更）
- [x] サブスクライバー登録のテストケースを更新
  - [x] Tap登録が呼ばれることを検証
  - [x] ~~Tap登録失敗時の動作を検証~~ → エラーハンドリングなしのため削除

**注意**: ~~Tap登録失敗時でもサブスクライバー作成は成功とする（後で手動リトライ可能）~~ → エラーハンドリング不要の設計に変更

## 3. フォロー作成時にフォロワーがサブスクライバーの場合のみフォロイーのDIDをTapに登録

**目的**: サブスクライバーが新しくフォローした際に、フォロイーのDIDをTapに登録する

**実装場所**:

- `apps/worker/src/application/services/indexer/follow-indexer.ts`
- テスト: `apps/worker/src/application/services/indexer/follow-indexer.test.ts`

**タスク**:

- [x] フォローレコードインデックス処理にTap登録を追加
  - [x] FollowIndexerにTapClientとISubscriptionRepositoryを依存性として追加
  - [x] 新規フォロー作成時、フォロワー（`follow.actorDid`）がサブスクライバーかどうかをチェック
  - [x] サブスクライバーの場合のみフォロイーのDID（`follow.subjectDid`）をTapに登録
- [x] フォローインデックス処理のテストケースを更新
  - [x] フォロワーがサブスクライバーの場合、フォロイーのDIDがTapに登録されることを検証
  - [x] フォロワーがサブスクライバーでない場合、TapにDIDが登録されないことを検証
- [x] worker環境変数にTAP_URLを追加
- [x] DIコンテナにTapClientを登録

**注意**: フォロー「される側」(followee)ではなく、フォロー「する側」(follower)がサブスクライバーかどうかを判定する

## 4. ~~バックフィル処理からフォロー発見時にTapに登録~~ (不要)

**状態**: ❌ 不要 - タスク3で実現済み

**理由**:

このタスクはタスク3の実装により既に実現されています:

1. サブスクライバー登録時、`SyncRepoUseCase`がスケジュールされる ([subscribe-server-use-case.ts:94](../../apps/appview/src/application/subscribe-server-use-case.ts#L94))
2. `SyncRepoUseCase`がPDSから全レコードを取得し、フォローレコードを処理 ([sync-repo-use-case.ts:72-88](../../apps/worker/src/application/use-cases/async/sync-repo-use-case.ts#L72-L88))
3. フォローレコード処理時、`FollowIndexer.upsert`が呼ばれ、タスク3の実装により自動的にフォロイーのDIDがTapに登録される ([follow-indexer.ts:41-47](../../apps/worker/src/application/services/indexer/follow-indexer.ts#L41-L47))

つまり、バックフィル処理(SyncRepoUseCase)がフォローレコードを発見した際、既存の`FollowIndexer`の実装によって自動的にTap登録が行われるため、追加実装は不要です。

## 5. レコードインデックスポリシーの条件分岐を削除

**目的**: Tapがフィルタリングを行うため、AppView側の条件分岐を削除し、全イベントを処理する

**状態**: ✅ 完了

**実装内容**:

調査の結果、以下が判明しました:

- ingesterは既に全イベントをジョブキューに送信（条件分岐なし）
- workerのcommitイベント処理は既に全レコードを無条件でインデックス
- workerのidentityイベント処理のみ条件分岐が存在

**完了した作業**:

- [x] UpsertIdentityUseCaseの条件分岐を削除
  - [x] `shouldIndexActor`メソッドと`isTrackedActor`チェックを削除
  - [x] 全identityイベントを無条件でインデックス
  - [x] テストを新仕様に合わせて更新
- [x] 全IndexingPolicyクラスとテストを削除
  - [x] `apps/worker/src/domain/indexing-policy/`ディレクトリ全体を削除
  - [x] PostIndexingPolicy, LikeIndexingPolicy, RepostIndexingPolicy等を削除
- [x] ICollectionIndexerインターフェースから`shouldIndex`メソッドを削除
- [x] 各Indexerから`shouldIndex`メソッドとIndexingPolicy依存を削除
  - [x] PostIndexer, LikeIndexer, RepostIndexer, GeneratorIndexer, ProfileIndexer, FollowIndexer
- [x] DIコンテナ(worker.ts, test-utils.ts)からIndexingPolicyを削除
- [x] 全197個のunit testが成功

**結果**:

Tapから送信される全イベント（commit, identity）を無条件でインデックスするようになりました。フィルタリングの責務は完全にTap側に移譲されました。

## 6A. 手動バックフィル処理のコードを削除

**状態**: ✅ 完了

**目的**: Tapの自動バックフィル機能があるため、PDS直接アクセスによる手動バックフィル処理を削除する

**実装場所**:

- `apps/appview/src/application/service/scheduler/sync-repo-scheduler.ts`
- `apps/worker/src/application/use-cases/async/sync-repo-use-case.ts`
- `apps/worker/src/infrastructure/fetchers/repo-fetcher/`

**完了した作業**:

- [x] SubscribeServerUseCaseからSyncRepoScheduler呼び出しを削除
  - [x] `apps/appview/src/application/subscribe-server-use-case.ts`
    - import削除
    - constructorからsyncRepoScheduler削除
    - injectからsyncRepoScheduler削除
    - `syncRepoScheduler.schedule()`呼び出し削除
  - [x] テストファイルも更新 (`subscribe-server-use-case.test.ts`)
- [x] DIコンテナから削除
  - [x] `apps/appview/src/appview.ts` - SyncRepoScheduler登録削除
  - [x] `apps/worker/src/worker.ts` - SyncRepoUseCase, RepoFetcher登録削除
  - [x] `apps/worker/src/presentation/worker.ts` - SyncWorkerからsyncRepoワーカー削除
  - [x] `apps/worker/src/shared/test-utils.ts` - InMemoryRepoFetcher登録削除
- [x] ファイル削除
  - [x] `apps/appview/src/application/service/scheduler/sync-repo-scheduler.ts`
  - [x] `apps/worker/src/application/use-cases/async/sync-repo-use-case.ts`
  - [x] `apps/worker/src/application/use-cases/async/sync-repo-use-case.test.ts`
  - [x] `apps/worker/src/infrastructure/fetchers/repo-fetcher/`（ディレクトリ全体）
  - [x] `apps/worker/src/application/interfaces/external/repo-fetcher.ts`
- [x] 動作確認
  - [x] 型チェックが通ることを確認
  - [x] 全190個のunitテストが成功

**結果**:

手動バックフィル処理を完全に削除し、Tapの自動バックフィル機能に移行しました。サブスクライバー登録時にはTapへのDID登録のみを行い、レコードの取得はTapが自動的に行うようになりました。

## 6B. ActorエンティティからsyncRepo関連を削除

**状態**: ✅ 完了

**目的**: 手動バックフィル処理の状態管理が不要になったため、ActorエンティティからsyncRepo関連のプロパティとメソッドを削除する

**実装場所**:

- `packages/common/src/lib/domain/actor/actor.ts`
- `packages/common/src/lib/domain/actor/actor.factory.ts`

**完了した作業**:

- [x] Actorエンティティから削除
  - [x] `packages/common/src/lib/domain/actor/actor.ts`
    - SyncRepoStatus型削除
    - ActorParams内のsyncRepoStatus, syncRepoVersion削除
    - Actor.\_syncRepoStatus, \_syncRepoVersion削除
    - getter: syncRepoStatus(), syncRepoVersion()削除
    - メソッド: startSyncRepo(), markSyncRepoReady(), completeSyncRepo(), failSyncRepo()削除
  - [x] `packages/common/src/lib/domain/actor/actor.factory.ts`
    - syncRepoStatus, syncRepoVersionパラメータ削除
- [x] リポジトリ実装から削除
  - [x] `apps/appview/src/infrastructure/actor-repository/actor-repository.ts`
  - [x] `apps/worker/src/infrastructure/repositories/actor-repository/actor-repository.ts`
- [x] DBスキーマから削除
  - [x] `packages/db/src/schema.ts`
    - syncRepoStatus列挙型定義削除
    - actors.syncRepoStatusカラム削除
    - actors.syncRepoVersionカラム削除
- [x] テストファイル更新
  - [x] `apps/appview/src/infrastructure/actor-repository/actor-repository.test.ts`
  - [x] `apps/appview/src/application/subscribe-server-use-case.test.ts`
  - [x] `apps/appview/src/application/get-subscription-status-use-case.test.ts` (一時的に修正、タスク6Cで完全対応)
- [x] 動作確認
  - [x] 型チェックが通ることを確認 (`pnpm typecheck`)
  - [x] 全188個のunitテストが成功 (`pnpm all:unit`)

**結果**:

ActorエンティティからsyncRepo関連のプロパティとメソッドを完全に削除しました。手動バックフィル処理の状態管理は不要になり、Actorエンティティはシンプルになりました。

## 6C. GetSubscriptionStatusからsyncRepoStatusを削除

**状態**: ✅ 完了

**目的**: API仕様からsyncRepoStatusフィールドを削除する（破壊的変更）

**実装場所**:

- `packages/client/lexicons/me/subsco/sync/getSubscriptionStatus.json`
- `apps/appview/src/application/get-subscription-status-use-case.ts`

**完了した作業**:

- [x] Lexicon定義を更新
  - [x] `packages/client/lexicons/me/subsco/sync/getSubscriptionStatus.json`
    - subscribed定義からsyncRepoStatusフィールド削除
  - [x] `pnpm install` を実行してクライアントコード再生成
- [x] GetSubscriptionStatusUseCaseを更新
  - [x] `apps/appview/src/application/get-subscription-status-use-case.ts`
    - 返り値からsyncRepoStatus削除
- [x] テストファイル更新
  - [x] `apps/appview/src/application/get-subscription-status-use-case.test.ts`
  - [x] `packages/test-utils/src/factory.ts` (actorFactoryからsyncRepoStatus/syncRepoVersion削除)
- [x] 動作確認
  - [x] `pnpm all` で全テストを実行
  - [x] すべての341個のテストが成功することを確認

**結果**:

API仕様から`syncRepoStatus`フィールドを完全に削除しました。`me.subsco.sync.getSubscriptionStatus#subscribed`レスポンスは`isSubscriber`フィールドのみを返すようになり、手動バックフィル処理の状態管理に関連するフィールドは完全に削除されました。

## 7. テストケースの更新と追加

**状態**: ✅ タスク1-5で完了済み

タスク1-5の実装時に以下のテストが既に追加・更新されています:

**追加済みのテスト**:

- ✅ TapClient機能のテスト (タスク1)
- ✅ サブスクライバー登録時のTap登録テスト (タスク2)
- ✅ フォロー作成時のTap登録テスト (タスク3)
- ✅ インデックスポリシー削除に伴うテスト更新 (タスク5)

**残作業**: タスク6完了時に削除される手動バックフィル関連のテスト更新のみ（タスク6.3に含む）

## 実装の順序

1. タスク1: TapClient実装 ✅
2. タスク2: サブスクライバー登録時のTap登録 ✅
3. タスク3: フォロー作成時のTap登録 ✅
4. ~~タスク4: バックフィル時のTap登録~~ ❌ 不要（タスク3で実現済み）
5. タスク5: インデックスポリシー削除 ✅
6. タスク6A: 手動バックフィル処理のコードを削除 ✅
7. タスク6B: ActorエンティティからsyncRepo関連を削除 ✅
8. タスク6C: GetSubscriptionStatusからsyncRepoStatusを削除 ✅
9. タスク7: テストケースの更新 ✅ (各タスクに含まれる)

## 注意事項

- Tapの自動バックフィルがあるため、手動バックフィル処理は基本的に不要になる
- レコードのインデックスポリシーはTap側でフィルタリングされるため、AppView側では全イベントを処理する
- 既存のサブスクライバーに対しても、Tapへの登録を行う移行処理が必要になる可能性がある

## 技術的な検討事項

### Tapの`repos/add`エンドポイント仕様

現時点で確認が必要な点：

- [ ] エンドポイントのURL構造（例: `POST /repos/add`）
- [ ] リクエストボディの形式（DIDの渡し方）
- [ ] レスポンスの形式（成功/失敗の判定方法）
- [ ] 冪等性の保証（重複登録の扱い）
- [ ] レート制限の有無
- [ ] 認証方式（必要な場合）

参考: Tapの公式ドキュメントまたはソースコードを確認する

### エラーハンドリング戦略

Tap登録失敗時の対応方針：

1. **サブスクライバー登録時**: ログ記録 + 継続（後で手動リトライ可能）
2. **フォロー作成時**: ログ記録 + 継続（フォロー自体は成功）
3. **バックフィル時**: リトライ + 失敗時はスキップして継続

### パフォーマンス最適化

- バックフィル時のTap登録はバッチ化を検討
- 並列処理でスループットを向上
- Tap登録の進捗状況をモニタリング

## データ移行について

既存のサブスクライバーをTapに登録する移行スクリプトが必要になる可能性があります：

```typescript
// 移行スクリプトの例（擬似コード）
async function migrateExistingSubscribers() {
  const subscribers = await getAllSubscribers();
  for (const subscriber of subscribers) {
    await tapClient.addRepo(subscriber.did);
    // フォロー関係も登録
    const follows = await getFollows(subscriber.did);
    for (const follow of follows) {
      await tapClient.addRepo(follow.subject);
    }
  }
}
```

このスクリプトは別タスクとして管理することを推奨します。

## 開発コマンド

タスク実装中に使用するコマンド：

```bash
# 型チェック、フォーマット、全テストを実行
pnpm all

# 型チェック、フォーマット、unitテストのみ実行（Dockerなし）
pnpm all:unit

# 特定のテストファイルのみ実行
pnpm all tap-client

# 特定パッケージのみチェック
pnpm typecheck --filter @repo/common
```

詳細は [CLAUDE.md](../../CLAUDE.md) の開発コマンドセクションを参照。
