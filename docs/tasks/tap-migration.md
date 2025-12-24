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

## 6. 手動バックフィル処理を削除

**目的**: Tapの自動バックフィル機能があるため、手動バックフィル処理を削除する

**実装場所**:

- バックフィル関連のコード（PDS直接アクセス処理）
- バックフィルジョブ定義

**タスク**:

- [ ] 既存のPDS直接アクセスによるバックフィル処理を調査
  - [ ] どの部分がTapの自動バックフィルで置き換え可能か確認
  - [ ] 削除できる処理と残すべき処理を判断
- [ ] 不要になったバックフィル処理を削除または無効化
  - [ ] PDS直接フェッチ処理
  - [ ] 手動バックフィルジョブ
  - [ ] バックフィル関連のキュー定義
- [ ] Tapのバックフィル完了を待つ仕組みを検討（必要な場合）
- [ ] バックフィル関連のテストを更新

**注意**:

- プロフィール取得など、Tapでカバーされない処理は残す必要がある
- 段階的に削除し、動作確認しながら進める

## 7. 既存のテストケースの更新

**目的**: 削除・変更したコードに対応するテストケースを更新する

**実装場所**:

- 各インデクサーのテストファイル
- バックフィル関連のテストファイル

**タスク**:

- [ ] インデックスポリシー関連のテストを削除
  - [ ] 「追跡アカウントのみ保存」などの条件テスト
  - [ ] 「サブスクライバーへのリプライのみ保存」などの条件テスト
  - [ ] 「追跡アカウントの投稿へのいいね/リポストのみ保存」などの条件テスト
- [ ] バックフィル関連のテストを更新
  - [ ] 手動バックフィル処理のテスト削除
  - [ ] Tapバックフィル前提のテストに変更

**テストの書き方**: [docs/dev/testing.md](../dev/testing.md)を参照

## 8. 新機能のテストケースを追加

**目的**: Tap統合機能の動作を保証するテストを追加する

**実装場所**:

- TapClientのテスト
- 各ユースケースのテスト

**タスク**:

- [ ] Tap登録機能のテスト（TapClient）
  - [ ] repos/add呼び出しの成功ケース
  - [ ] 重複登録のケース（冪等性確認）
  - [ ] エラーハンドリングのケース
  - [ ] リトライ処理のケース
- [ ] フォロー作成時のTap登録テスト
  - [ ] 新規フォロー時にTapに登録されることを検証
  - [ ] Tap登録失敗時でもフォロー処理は成功することを検証
- [ ] 全イベント処理のテスト
  - [ ] Tapから送信される様々なイベントが全て処理されることを検証
  - [ ] 条件によって拒否されるイベントがないことを検証

**テストケース名の例**:

- 「サブスクライバー登録時、そのDIDがTapに登録される」
- 「フォロー作成時、フォロイーのDIDがTapに登録される」
- 「Tap登録失敗時、エラーログが記録されるが処理は継続する」

## 実装の順序

推奨される実装順序：

1. タスク1: TapClient実装（他のタスクの基盤） ✅
2. タスク2: サブスクライバー登録時のTap登録 ✅
3. タスク3: フォロー作成時のTap登録 ✅
4. ~~タスク4: バックフィル時のTap登録~~ ❌ 不要（タスク3で実現済み）
5. タスク5: インデックスポリシー削除 ✅
6. タスク6: 手動バックフィル削除
7. タスク7, 8: テスト更新

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
