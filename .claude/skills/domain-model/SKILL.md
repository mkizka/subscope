---
name: domain-model
description: worker・appview・webで型やクラスを新規作成・変更する前に必ず参照する。新しい機能、ユースケース、XRPC、lexiconのインデックス、リポジトリ、クエリサービスを実装するときや、application/dtoやdomain以下にファイルを作るとき、「ドメインモデルにする?」「DTOでいい?」と迷ったときに使用する。
---

# ドメインモデルにするかDTOにするか

どこに置くかと、どんな形にするかは、別々に決める。

## どこに置くか

| 置き場            | 置くもの                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `domain`          | 仕様書や用語集に出てくる概念と、その決まり。リポジトリが保存・取得する物 |
| `application/dto` | 層の境界でデータを運ぶだけの型。クエリサービスが返す型など               |

`domain` は `application` や `infrastructure` を参照しない。ドメインサービスが使うリポジトリやクエリのインターフェースは `domain/interfaces` に置く。DTOは判断を持たない。読み取りでドメインモデルを返さない(docs/dev/repository-and-query.md)。

例:

- `apps/worker/src/domain/post.ts` の `Post`。レコードから何を残すか、誰に通知するか、どの引用先を取りに行くかを持つ
- `apps/appview/src/domain/models/invite-code.ts` の `InviteCode`。`generate` でコードの形を決め、`markAsUsed` は期限切れや使用済みなら例外を投げる
- `apps/appview/src/application/dto/invite-code-dto.ts` の `InviteCodeDto`。クエリサービスが返す

## どんな形にするか

`domain` の概念はクラスにする。

- コンストラクタはprivateにし、`fromRecord` や `create` などのstaticメソッドからだけ作る。検証を通らない値を作れないようにする
- 判定や計算は、サービスやユースケースに散らさず、その概念のメソッドにする
- 状態を変える操作に決まりがあれば、メソッドの中で検査し、外から状態を直接書き換えられないようにする

ほかの概念から作るだけで決まりを持たない値(`FeedItem` など)は、`type` でよい。DIDやハンドルなど1つの値の形式は、クラスで包まず `asDid` や `asHandle` のようなブランド型で守る。

## DBに聞かないと分からない判定

1つの概念に収まらない決まりや、DBに聞かないと判断できない決まりは、`domain/services` のドメインサービスに置く。ドメインサービスは状態を持たず、`domain/interfaces` のインターフェース越しにDBへ聞く。

```ts
// domain/services/storage-policy.ts
async storesFeedRecord({ ctx, origin, record }) {
  return (
    !origin.isPast ||
    (await this.registrationQuery.isRegistered(ctx, record.accountDid)) ||
    (await this.isWithinWindow(ctx, origin, record))
  );
}
```

アプリケーション層は、ドメインサービスに聞いた結果で分岐するだけにする。メンバーかどうかなどを自分でDBに聞いて条件を組み立てない。

例: `apps/worker/src/domain/services/storage-policy.ts` の `StoragePolicy`(何を保存し、何を取りに行くか)、`notification-policy.ts` の `NotificationPolicy`(誰に通知するか)

## 基準に合っていない既存の型

次は今の基準に合っていない。新しいコードで真似しない。

| 型                                                                 | 理由                                           |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| `apps/appview/src/domain/models/registration.ts` の `Registration` | メソッドがなく、クエリサービスからも返している |
