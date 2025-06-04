# Lexicon Record Implementation Guide

このドキュメントは、新しいlexiconレコードタイプのインデックス機能実装の汎用的な仕様と実行計画を記載しています。

## 概要

AT Protocolにおける新しいレコードタイプを追加する際の標準的な実装パターンです。Dawnアーキテクチャでは、レコードがJetstreamから流れてきてデータベースにインデックスされるまでの一連の流れを実装する必要があります。

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

### Lexicon定義例

**ファイル:** `/packages/client/lexicons/{namespace}/{collection}.json`

```json
{
  "lexicon": 1,
  "id": "{namespace}.{collection}",
  "defs": {
    "main": {
      "type": "record",
      "description": "{Record type description}",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["{required_field_1}", "createdAt"],
        "properties": {
          "{field_name}": {
            "type": "string",
            "format": "{format}",
            "description": "{Field description}"
          },
          "createdAt": {
            "type": "string",
            "format": "datetime",
            "description": "Client-declared timestamp when this record was created."
          }
        }
      }
    }
  }
}
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
import { Record } from "@dawn/client";

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
import { TransactionContext } from "@dawn/db";
import { {RecordType} } from "@dawn/common/domain";

export interface I{RecordType}Repository {
  upsert: (ctx: TransactionContext, {recordInstance}: {RecordType}) => Promise<void>;
}
```

#### 2.2 Repository実装

**ファイル:** `/apps/worker/src/infrastructure/{record-type}-repository.ts`

```typescript
import { TransactionContext, schema } from "@dawn/db";
import { {RecordType} } from "@dawn/common/domain";
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

### 3. Service層

#### 3.1 IndexService

**ファイル:** `/apps/worker/src/application/service/index-{record-type}-service.ts`

```typescript
import { TransactionContext } from "@dawn/db";
import { Record } from "@dawn/client";
import { {RecordType} } from "@dawn/common/domain";
import { I{RecordType}Repository } from "../interfaces/{record-type}-repository.js";
import { IIndexCollectionService } from "../interfaces/index-collection-service.js";

export class Index{RecordType}Service implements IIndexCollectionService {
  constructor(private {recordType}Repository: I{RecordType}Repository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }): Promise<void> {
    const {recordInstance} = {RecordType}.from(record);
    await this.{recordType}Repository.upsert(ctx, {recordInstance});
  }
}
```

#### 3.2 IndexCommitService更新

**ファイル:** `/apps/worker/src/application/service/index-commit-service.ts`

```typescript
// コンストラクターに追加
constructor(
  // 既存のパラメーター...
  private index{RecordType}Service: Index{RecordType}Service,
) {
  this.services = {
    "app.bsky.feed.post": indexPostService,
    "app.bsky.actor.profile": indexProfileService,
    "app.bsky.graph.follow": indexFollowService,
    "{namespace}.{collection}": index{RecordType}Service, // 追加
  };
}
```

### 4. 依存性注入更新

#### 4.1 Worker DIコンテナ更新

**ファイル:** `/apps/worker/src/worker.ts`

```typescript
// {RecordType}RepositoryとIndex{RecordType}Serviceの注入設定を追加
```

## 実装チェックリスト

### 事前準備

- [ ] Lexicon定義ファイル作成 (`/packages/client/lexicons/{namespace}/{collection}.json`)
- [ ] データベーステーブル定義追加 (`/packages/db/src/schema.ts`)

### 実装ファイル

- [ ] ドメインモデル (`/packages/common/src/lib/domain/{record-type}.ts`)
- [ ] Repositoryインターフェース (`/apps/worker/src/application/interfaces/{record-type}-repository.ts`)
- [ ] Repository実装 (`/apps/worker/src/infrastructure/{record-type}-repository.ts`)
- [ ] Indexサービス (`/apps/worker/src/application/service/index-{record-type}-service.ts`)

### 統合作業

- [ ] SUPPORTED_COLLECTIONS更新 (`/packages/common/src/lib/utils/collection.ts`)
- [ ] IndexCommitService更新 (`/apps/worker/src/application/service/index-commit-service.ts`)
- [ ] DIコンテナ更新 (`/apps/worker/src/worker.ts`)

### テスト

- [ ] マイグレーション実行
- [ ] Jetstreamからのレコード処理確認
- [ ] データベースへの保存確認

## 実装の流れ

1. **事前準備**: Lexicon定義とデータベーステーブル作成
2. **基盤準備**: SUPPORTED_COLLECTIONSとドメインモデル
3. **Repository層**: インターフェースと実装
4. **Service層**: インデックスサービス作成
5. **統合**: DIコンテナでの配線
6. **テスト**: Jetstreamからの実際のレコード処理確認

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
Jetstream WebSocket → Ingester → BullMQ Queue → Worker → IndexCommitService → Index{RecordType}Service → {RecordType}Repository → Database
```

## サンプル実装：Subscriptionレコード

実際の実装例として`dev.mkizka.test.subscription`の場合：

### 具体的なファイル名

- ドメインモデル: `subscription.ts`
- Repository: `subscription-repository.ts`
- Service: `index-subscription-service.ts`
- テーブル名: `subscriptions`
- Collection ID: `dev.mkizka.test.subscription`

このガイドを参考に、任意のlexiconレコードタイプを同様のパターンで実装できます。
