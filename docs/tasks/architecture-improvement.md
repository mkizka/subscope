# AppView アーキテクチャ改善タスク

DDD/オニオンアーキテクチャの観点から特定された問題点と改善タスクの一覧です。

## 改善が必要な問題点の詳細分析

### 1. HTTP関連サービスの配置ミス（重要度：高）

**問題箇所：**

- `/apps/appview/src/application/service/request/auth-verifier-service.ts`
- `/apps/appview/src/application/service/request/handle-service.ts`

**問題内容：**

- `AuthVerifierService`と`HandleService`は本来HTTP関連の処理であり、presentation層に属すべき
- これらはドメインロジックではなく、リクエスト処理に特化したサービス
- 現在の配置により、application層にHTTP関連の知識が漏れている

### 2. Presentation層のDB依存（重要度：高）

**問題箇所：**

- `/apps/appview/src/presentation/routes/app/bsky/feed/getLikes.ts`
- その他の複数のルートハンドラー

**問題内容：**

```typescript
export class GetLikes {
  constructor(
    private getLikesUseCase: GetLikesUseCase,
    private db: DatabaseClient, // ← presentation層にDB依存が漏れている
  ) {}
```

- presentation層がDataBaseClientに直接依存している
- ルートハンドラーがデータベースの知識を持つべきではない

### 3. Builderクラスの責務混在（重要度：中）

**問題箇所：**

- `/apps/appview/src/application/service/actor/profile-view-builder.ts`
- `/apps/appview/src/application/service/feed/post-embed-view-builder.ts`

**問題内容：**

```typescript
// ProfileViewBuilderの例
private getAvatarThumbnailUrl(profile: ProfileDetailed) {
  if (!profile.avatar) {
    return undefined;
  }
  return `${env.BLOB_PROXY_URL}/images/avatar_thumbnail/${profile.actorDid}/${profile.avatar.cid}.jpg`;
}
```

- 環境変数（`env.BLOB_PROXY_URL`）を直接参照している
- URL構築ロジックがBuilderに混在している
- Builderの責務が表示形式の変換を超えて、インフラストラクチャ関連の処理を含んでいる

### 4. ビジネスロジックの不備（重要度：中）

**問題箇所：**

- `/apps/appview/src/application/use-cases/feed/get-author-feed-use-case.ts`

**問題内容：**

```typescript
// TODO: posts_and_author_threads以外もサポート
if (params.filter !== "posts_and_author_threads") {
  return {
    feed: [],
    cursor: undefined,
  };
}
```

- ビジネスルールがハードコードされている
- フィルタロジックが適切にドメインサービスに分離されていない

### 5. バリデーションロジックの分散（重要度：中）

**問題箇所：**

- `/apps/appview/src/presentation/routes/app/bsky/feed/getAuthorFeed.ts`

**問題内容：**

```typescript
// パラメータ変換がPresentation層で行われている
cursor: params.cursor ? new Date(params.cursor) : undefined,
```

- データ変換ロジックがpresentation層に散在している
- 本来はapplication層またはドメイン層で処理すべき

### 6. エラーハンドリングの不統一（重要度：中）

**問題内容：**
各ルートハンドラーでエラーレスポンスの形式が統一されていない

```typescript
// getAuthorFeed.ts
return {
  status: 400,
  message: "Invalid actor",
};

// 他の箇所では
throw new InvalidRequestError("Invalid actor");
```

## 改善タスク一覧

### Phase 1: 緊急度の高い責務分離修正

#### タスク1: Request関連サービスの移動

- **優先度**: 高
- **対象ファイル**:
  - `/apps/appview/src/application/service/request/auth-verifier-service.ts`
  - `/apps/appview/src/application/service/request/handle-service.ts`
- **作業内容**:
  1. 新しいディレクトリ `/apps/appview/src/presentation/middleware/` を作成
  2. `AuthVerifierService` を `auth-verifier-middleware.ts` として移動
  3. `HandleService` を `handle-middleware.ts` として移動
  4. 依存関係の更新（DIコンテナ、インポート文）
  5. テストファイルの移動・更新

#### タスク2: Presentation層のDB依存除去

- **優先度**: 高
- **対象ファイル**:
  - `/apps/appview/src/presentation/routes/app/bsky/feed/getLikes.ts`
  - その他DatabaseClientに依存するルートハンドラー
- **作業内容**:
  1. ルートハンドラーのコンストラクタから `DatabaseClient` を削除
  2. use-caseに `db: DatabaseClient` パラメータを追加（必要に応じて）
  3. DIコンテナの依存関係を更新
  4. 全ルートハンドラーで同様の修正を実施

### Phase 2: アーキテクチャの整理

#### タスク3: Builder層からインフラ関連処理を分離

- **優先度**: 中
- **対象ファイル**:
  - `/apps/appview/src/application/service/actor/profile-view-builder.ts`
  - `/apps/appview/src/application/service/feed/post-embed-view-builder.ts`
- **作業内容**:
  1. URL構築専用のサービスを infrastructure層に作成
  2. `UrlBuilderService` または `AssetUrlService` の実装
  3. Builderクラスから環境変数参照を除去
  4. URLサービスをBuilderに注入する形に変更

#### タスク4: ビジネスロジックのドメインサービス移動

- **優先度**: 中
- **対象ファイル**:
  - `/apps/appview/src/application/use-cases/feed/get-author-feed-use-case.ts`
- **作業内容**:
  1. `AuthorFeedFilterService` ドメインサービスを作成
  2. フィルタロジックをドメインサービスに移動
  3. use-caseからドメインサービスを呼び出す形に変更
  4. ハードコードされたビジネスルールを設定可能にする

#### タスク5: エラーハンドリングの統一化

- **優先度**: 中
- **対象ファイル**: 全ルートハンドラー
- **作業内容**:
  1. 共通のエラーレスポンス形式を定義
  2. エラーハンドリングミドルウェアの作成
  3. 全ルートハンドラーでエラー形式を統一
  4. カスタム例外クラスの整理・統一

#### タスク6: パラメータ変換の整理

- **優先度**: 低
- **対象ファイル**: データ変換が散在するルートハンドラー
- **作業内容**:
  1. 共通のパラメータ変換ロジックをapplication層に移動
  2. バリデーション・変換専用のサービス作成
  3. presentation層からデータ変換ロジックを除去

### Phase 3: 長期的改善（オプション）

#### タスク7: ドメインイベントの導入

- **優先度**: 低
- **作業内容**: 複雑なビジネスロジックのイベント駆動設計への移行

#### タスク8: CQRSパターンの適用

- **優先度**: 低
- **作業内容**: 読み取り専用の複雑なクエリの分離

## 実装時の注意事項

### アーキテクチャガイドライン

- **依存関係の方向**: presentation → application → domain → infrastructure
- **単一責任原則**: 各クラス・メソッドは1つの責務のみ
- **ドメイン知識の保護**: ドメインロジックがpresentation層に漏れないよう注意

### 技術的注意事項

- 全てのデータベース操作でTransactionContextを使用
- 既存コードと一貫性を保つエラーハンドリング
- TypeScriptの型チェックを完全に通すこと
- 新しいコードには適切なテストを追加

### テスト戦略

- 移動したクラスのテストも同時に移動
- 依存関係変更に伴うテストの更新
- アーキテクチャ境界を守るためのアーキテクチャテストの追加

## 完了確認項目

各タスク完了時に以下を確認：

- [ ] `pnpm typecheck` でエラーなし
- [ ] `pnpm format` でlintエラーなし
- [ ] 既存テストが全て通る
- [ ] 適切なアーキテクチャ境界が維持されている
- [ ] DIコンテナの依存関係が正しく更新されている
