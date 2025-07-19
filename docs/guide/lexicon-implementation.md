# Lexicon Record Implementation Guide

このドキュメントは、新しいlexiconレコードタイプのインデックス機能実装の汎用的な仕様と実行計画を記載しています。

## 概要

AT Protocolにおける新しいレコードタイプを追加する際の標準的な実装パターンです。

このプロジェクトでは、レコードがJetstreamから流れてきてデータベースにインデックスされるまでの一連の流れを実装する必要があります。

## テンプレート変数

実装時に以下の変数を適切な値に置き換えてください：

- `{namespace}`: レコードの名前空間（例：`dev.mkizka.test`）
- `{collection}`: コレクション名（例：`subscription`）
- `{RecordType}`: ドメインクラス名（例：`Subscription`）
- `{recordType}`: 変数名（例：`subscription`）
- `{recordInstance}`: インスタンス変数名（例：`subscription`）
- `{record-type}`: ファイル名用（例：`subscription`）
- `{tableName}`: テーブル名（例：`subscriptions`）
- `{customField}`: レコード固有のフィールド名（例：`appviewDid`）

## Lexicon定義ファイルの取得

**重要**: Lexicon定義ファイルは手動で作成せず、AT Protocol公式リポジトリから取得する必要があります。

### postinstall.shの更新

**ファイル:** `/packages/client/scripts/postinstall.sh`

新しいレコードタイプを追加する際は、pathsに対象のlexiconファイルパスを追加してください：

```bash
paths=(
  "app/bsky/actor/defs.json"
  "app/bsky/actor/getProfile.json"
  # ...既存のパス...
  "app/bsky/feed/generator.json" # 新しく追加
  # ...その他のパス...
)
```

### Lexicon定義の取得手順

1. `/packages/client/scripts/postinstall.sh`のpaths配列に該当するlexiconファイルパスを追加
2. `pnpm install`を実行してAT Protocol公式リポジトリからlexicon定義を取得
3. `pnpm build`を実行してTypeScript型定義を生成

### 生成されるファイル例

取得したlexicon定義から以下のファイルが自動生成されます：

```
/packages/client/src/generated/api/types/{namespace}/{collection}.ts
/packages/client/dist/generated/api/types/{namespace}/{collection}.d.ts
```

### データベース定義例

**ファイル:** `/packages/db/src/schema.ts`

```typescript
export const {table_name} = pgTable("{table_name}", {
  uri: varchar({ length: 256 })
    .primaryKey()
    .references(() => records.uri, { onDelete: "cascade" }),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  // レコード固有のフィールド
  {custom_field}: varchar({ length: 256 }).notNull(),
  createdAt: timestamp().notNull(),
  indexedAt: timestamp().defaultNow(),
});
```

## 実装パターン（汎用）

### 1. 基盤準備

#### 1.1 SUPPORTED_COLLECTIONSに追加

**ファイル:** `/packages/common/src/lib/utils/collection.ts`

```typescript
export const SUPPORTED_COLLECTIONS = [
  "app.bsky.actor.profile",
  "app.bsky.feed.post",
  "app.bsky.graph.follow",
  "{namespace}.{collection}", // 新しいレコードタイプを追加
] as const;
```

#### 1.2 ドメインモデル作成

**ファイル:** `/packages/common/src/lib/domain/{record_type}.ts`

```typescript
import { Record } from "@repo/client";

export class {RecordType} {
  constructor(
    public readonly uri: string,
    public readonly cid: string,
    public readonly actorDid: string,
    public readonly {customField}: string, // レコード固有のフィールド
    public readonly createdAt: Date,
  ) {}

  static from(record: Record) {
    const parsed = record.validate("{namespace}.{collection}");
    return new {RecordType}(
      record.uri,
      record.cid,
      record.actorDid,
      parsed.{customField},
      new Date(parsed.createdAt),
    );
  }
}
```

### 2. Repository層

#### 2.1 Repositoryインターフェース

**ファイル:** `/apps/worker/src/application/interfaces/{record-type}-repository.ts`

```typescript
import { TransactionContext } from "@repo/common/domain";
import { {RecordType} } from "@repo/common/domain";

export interface I{RecordType}Repository {
  upsert: (ctx: TransactionContext, {recordInstance}: {RecordType}) => Promise<void>;
}
```

#### 2.2 Repository実装

**ファイル:** `/apps/worker/src/infrastructure/{record-type}-repository.ts`

```typescript
import { schema } from "@repo/db";
import { TransactionContext } from "@repo/common/domain";
import { {RecordType} } from "@repo/common/domain";
import { I{RecordType}Repository } from "../application/interfaces/{record-type}-repository.js";

export class {RecordType}Repository implements I{RecordType}Repository {
  async upsert(ctx: TransactionContext, {recordInstance}: {RecordType}): Promise<void> {
    await ctx.db
      .insert(schema.{tableName})
      .values({
        uri: {recordInstance}.uri,
        cid: {recordInstance}.cid,
        actorDid: {recordInstance}.actorDid,
        {customField}: {recordInstance}.{customField},
        createdAt: {recordInstance}.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.{tableName}.uri,
        set: {
          cid: {recordInstance}.cid,
          {customField}: {recordInstance}.{customField},
          createdAt: {recordInstance}.createdAt,
        },
      });
  }
}
```

### 3. ドメインサービス層（DDDパターン）

#### 3.1 インデックスポリシー（ドメインサービス）

**ファイル:** `/apps/worker/src/application/domain/{record-type}-indexing-policy.ts`

```typescript
import { Record } from "@repo/client";
import { TransactionContext } from "@repo/common/domain";

export class {RecordType}IndexingPolicy {
  static readonly inject = [] as const;

  async shouldIndex(ctx: TransactionContext, record: Record): Promise<boolean> {
    // レコードタイプ固有の保存条件判定ロジック
    // 例：subscriberかどうか、フォローグラフに含まれるかなど
    return true; // 実際の実装では条件に応じてboolean値を返す
  }
}
```

### 4. アプリケーションサービス層

#### 4.1 インデクサー（アプリケーションサービス）

**ファイル:** `/apps/worker/src/application/services/indexer/{record-type}-indexer.ts`

```typescript
import { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/client";
import { {RecordType} } from "@repo/common/domain";
import { I{RecordType}Repository } from "../../interfaces/{record-type}-repository.js";
import { {RecordType}IndexingPolicy } from "../../domain/{record-type}-indexing-policy.js";
import { IIndexCollectionService } from "../../interfaces/index-collection-service.js";

export class {RecordType}Indexer implements IIndexCollectionService {

  constructor(
    private {recordType}Repository: I{RecordType}Repository,
    private {recordType}IndexingPolicy: {RecordType}IndexingPolicy,
  ) {}
  static readonly inject = [
    "{recordType}Repository",
    "{recordType}IndexingPolicy",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }): Promise<void> {
    const shouldIndex = await this.{recordType}IndexingPolicy.shouldIndex(ctx, record);
    if (!shouldIndex) {
      return;
    }

    const {recordInstance} = {RecordType}.from(record);
    await this.{recordType}Repository.upsert(ctx, {recordInstance});
  }
}
```

#### 4.2 IndexCommitService更新

**ファイル:** `/apps/worker/src/application/service/index-commit-service.ts`

```typescript
// コンストラクターに追加
constructor(
  // 既存のパラメーター...
  private {recordType}Indexer: {RecordType}Indexer,
) {
  this.services = {
    "app.bsky.feed.post": postIndexer,
    "app.bsky.actor.profile": profileIndexer,
    "app.bsky.graph.follow": followIndexer,
    "{namespace}.{collection}": {recordType}Indexer, // 追加
  };
}
```

### 5. 依存性注入更新

#### 5.1 Worker DIコンテナ更新

**ファイル:** `/apps/worker/src/worker.ts`

```typescript
import { {RecordType}Repository } from "./infrastructure/{record-type}-repository.js";
import { {RecordType}IndexingPolicy } from "./application/domain/{record-type}-indexing-policy.js";
import { {RecordType}Indexer } from "./application/services/indexer/{record-type}-indexer.js";

// DIコンテナ設定
const container = createContainer()
  // Repository
  .register("{recordType}Repository", asClass({RecordType}Repository))
  // Domain Service
  .register("{recordType}IndexingPolicy", asClass({RecordType}IndexingPolicy))
  // Application Service
  .register("{recordType}Indexer", asClass({RecordType}Indexer));
```

## 実装チェックリスト

### 事前準備

- [ ] Lexicon定義ファイルの取得（`/packages/client/scripts/postinstall.sh`を更新）
- [ ] データベーステーブル定義追加 (`/packages/db/src/schema.ts`)

### 実装ファイル

- [ ] ドメインモデル (`/packages/common/src/lib/domain/{record-type}.ts`)
- [ ] Repositoryインターフェース (`/apps/worker/src/application/interfaces/{record-type}-repository.ts`)
- [ ] Repository実装 (`/apps/worker/src/infrastructure/{record-type}-repository.ts`)
- [ ] ドメインサービス (`/apps/worker/src/application/domain/{record-type}-indexing-policy.ts`)
- [ ] アプリケーションサービス (`/apps/worker/src/application/services/indexer/{record-type}-indexer.ts`)

### 統合作業

- [ ] SUPPORTED_COLLECTIONS更新 (`/packages/common/src/lib/utils/collection.ts`)
- [ ] IndexCommitService更新 (`/apps/worker/src/application/service/index-commit-service.ts`)
- [ ] DIコンテナ更新 (`/apps/worker/src/worker.ts`)

### テスト

- [ ] マイグレーション実行
- [ ] Jetstreamからのレコード処理確認
- [ ] データベースへの保存確認

## 実装の流れ

1. **事前準備**: Lexicon定義の取得とデータベーステーブル作成
2. **基盤準備**: SUPPORTED_COLLECTIONSとドメインモデル
3. **Repository層**: インターフェースと実装
4. **ドメインサービス層**: インデックスポリシー（ビジネスルール）作成
5. **アプリケーションサービス層**: インデクサー（実行フロー）作成
6. **統合**: DIコンテナでの配線
7. **テスト**: Jetstreamからの実際のレコード処理確認

## アーキテクチャガイドライン

### 既存パターンの踏襲

- **参考実装**: `follow`レコードの実装パターンに完全に従うこと
- **命名規則**: 既存のファイル命名規則を維持すること
- **コード構造**: クリーンアーキテクチャパターンを維持すること

### 技術的注意事項

- **トランザクション**: 全てのデータベース操作でTransactionContextを使用
- **エラーハンドリング**: 既存コードと一貫性を保つ
- **型安全性**: TypeScriptの型チェックを完全に通すこと
- **テストカバレッジ**: 新しいコードには適切なテストを追加

## データフロー

```
Jetstream WebSocket → Ingester → BullMQ Queue → Worker → IndexCommitService → {RecordType}Indexer → {RecordType}IndexingPolicy → {RecordType}Repository → Database
```

### DDDパターンによる責任分離

1. **{RecordType}Indexer**: レコード処理の実行フローを制御
2. **{RecordType}IndexingPolicy**: ビジネスルール（保存条件）を判定
3. **{RecordType}Repository**: データベースアクセスを実行

## サンプル実装：Subscriptionレコード

実際の実装例として`me.subsco.sync.subscription`の場合：

### 具体的なファイル名

- ドメインモデル: `subscription.ts`
- Repositoryインターフェース: `subscription-repository.ts`
- Repository実装: `subscription-repository.ts`
- ドメインサービス: `subscription-indexing-policy.ts`
- アプリケーションサービス: `subscription-indexer.ts`
- テーブル名: `subscriptions`
- Collection ID: `me.subsco.sync.subscription`

このガイドを参考に、任意のlexiconレコードタイプを同様のパターンで実装できます。
