# Identity Event処理仕様

## 概要

Identity EventはAT Protocolにおいて、ユーザーのDIDドキュメントまたはハンドルに変更があった可能性があることを通知するイベントです。このプロジェクトではデータベースサイズを最小化するため、必要なactorのみを選択的に保存します。

## Identity Eventの特徴

- **変更内容は不明**: 何が変更されたかは示されず、IDの現在の状態が何であるかも保証されません
- **ハンドル情報**: イベントには現在のハンドルが含まれる場合があります
- **ackの送信**: Workerが処理を終えてからTapにackを送ります

参考: https://atproto.com/ja/specs/sync

## 処理フロー

```
Tap → Worker(TapSubscriber) → UpsertIdentityUseCase → ActorRepository
```

### 1. Worker (TapSubscriber)

- TapからIdentity Eventを受信
- メトリクスを記録
- UpsertIdentityUseCaseで処理し、終えたらTapにackを送る

### 2. Worker (UpsertIdentityUseCase)

Identity Eventの処理時、以下の条件でactorの保存を決定：

#### 保存条件

actorは以下のいずれかの条件を満たす場合のみデータベースに保存されます：

1. **Subscriberである**: 該当するDIDがsubscribersテーブルに存在する
2. **Subscriberのフォロワーがいる**: 該当するDIDをフォローしているsubscriberが存在する

#### 処理の詳細

1. ハンドルが含まれないイベントは無視
2. `shouldIndexActor`メソッドで保存条件をチェック
3. 条件を満たす場合のみ、ActorRepositoryを通じてデータベースを更新

## データベーススキーマ

### actorsテーブル

```typescript
{
  did: string,        // Primary Key
  handle: string?,    // nullable
  indexedAt: Date,
}
```

## 実装上の注意点

- Identity Eventは頻繁に発生するため、不要なactorの保存を避けることでデータベースサイズを抑制
- actorはIdentity Event以外にも、他のレコード（post, follow等）のインデックス時に間接的に作成される場合がある
