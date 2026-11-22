---
name: domain-model
description: worker・appview・webのapplication層で、新しい型をドメインモデル(domain以下のクラス)にするか単純な型(DTO)にするかを決めるとき、または既存の型の置き場所を見直すときに使用する。
---

# ドメインモデルにするかDTOにするか

迷ったら単純な型にする。クラスにするのは、守る決まりがあるときだけ。

## ドメインモデルにする

次のどちらかに当てはまるときだけ、`domain` 以下のクラスにする。

- 状態を変える操作に、破ってはいけない決まりがある。決まりはクラスのメソッドの中で検査し、外から状態を直接書き換えられないようにする
- 作るときの決まり(値の生成方法など)があり、ユースケースごとに書くと食い違うおそれがある

例: `apps/appview/src/domain/models/invite-code.ts` の `InviteCode`。`generate` でコードの形を決め、`markAsUsed` は期限切れや使用済みなら例外を投げる。

## 単純な型(DTO)にする

上に当てはまらなければ、`application/dto` 以下に `type` で書く。

- Tapのレコードなど外から来たデータを読み取っただけの型。検証と変換は `parseXxx` のような関数で行う
  - 例: `apps/worker/src/application/dto/follow.ts` の `Follow` と `parseFollow`
- 項目をそのまま書き換えるだけのsetterしか持たない型。メソッドが値の代入だけなら、クラスにしても守るものがない
- クエリサービスが返す型。読み取りでドメインモデルを返さない(docs/dev/repository-and-query.md)
  - 例: `apps/appview/src/application/dto/invite-code-dto.ts` の `InviteCodeDto`

DIDやハンドルなど1つの値の形式は、クラスで包まず `asDid` や `asHandle` のようなブランド型で守る。

## リポジトリとの関係

リポジトリ(find・save・delete)は、ドメインモデルでも単純な型でも使ってよい。単純な型のときは、取り出した値をスプレッド構文などで変えて保存する。

## 決まりに合っていない既存の型

次は今の基準ではドメインモデルにする理由がない。新しいコードで真似しない。

| 型                                                                 | 理由                                           |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| `apps/worker/src/domain/account.ts` の `Account`                   | メソッドが値を代入するsetterだけ               |
| `apps/appview/src/domain/models/registration.ts` の `Registration` | メソッドがなく、クエリサービスからも返している |
