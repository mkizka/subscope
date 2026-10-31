---
name: web-server
description: "apps/webのサーバー側処理(loader/action、middleware、OAuth、DI)を実装・変更するときに使用する。「webに画面を追加」「loader/actionを実装」「webのAPIルートを追加」「webのフォームを作る」などのタスクで発動する。"
---

# apps/web のサーバー構成

routes の loader/action はできるだけ薄くし、処理は `apps/web/app/server` 以下にオニオンアーキテクチャで置く。

## 層

| 層             | 場所                                | 置くもの                                                                                      |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| application    | `app/server/application/{関心}/`    | 画面1つ・操作1つごとのユースケース                                                            |
| infrastructure | `app/server/infrastructure/{関心}/` | OAuth、Cookie、DB、ジョブキュー、PDSへのXRPC呼び出しなど外部とのやりとり                      |
| presentation   | `app/routes/`, `app/middlewares/`   | 入力の検証、ユースケースの呼び出し、`data`/`redirect`での応答。React Routerの制約でここに置く |
| DI             | `app/server/di.ts`                  | 依存の組み立て                                                                                |
| 環境変数       | `app/server/env.ts`                 |                                                                                               |

- 依存の向きは presentation → application → infrastructure とする。application は infrastructure を、infrastructure のファイルが export する interface 経由でだけ使う
- web は状態を持たない BFF なので、ドメインモデルとリポジトリは置かない。PDS・appview とのやりとりは次の2種類に分ける
  - 読み込みは `{関心}-query.ts` の `I{関心}Query` にし、server で定義した DTO を返す。`app/features` の型は使わない
  - 書き込み(レコードの作成・削除、procedure の呼び出し)は `{関心}-command.ts` の `I{関心}Command` にする
- routes はユースケースだけを呼ぶ。Query・Command を1回呼ぶだけでもユースケースを置く
- ユースケースは PDS のクライアント(`@atproto/lex` の `Client`)を受け取らず、DID などの値だけを受け取る。クライアントの組み立てと XRPC の呼び出しは infrastructure で行い(`di.oauthClient.restore(did)`)、外部の値は infrastructure で画面が使う形に変換して返す
- ログイン中ユーザーの DID はミドルウェアが `didContext` に入れるので、routes は `context.get(didContext)` で取り出してユースケースに渡す

## 書き方

クラスは使わず、依存をオブジェクトで受け取って interface を返すファクトリ関数で書く。

```ts
export interface ITimelineQuery {
  findPosts: (did: string, cursor?: string) => Promise<TimelinePostDto[]>;
}

export const timelineQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): ITimelineQuery => ({
  async findPosts(did, cursor) { ... },
});
```

- 名前は `{名前}Factory`、戻り値の interface は `I{名前}` とし、同じファイルから export する
- 環境変数は `@/app/server/env` から直接読む。DI の value にしない
- ライブラリのクラスは関数内に閉じ込め、interface に出さない(例: `oauthClientFactory` は `NodeOAuthClient` を内部に持つ)

## DI

- `app/server/di.ts` で `createRegistry()` に `.service("名前", ["依存"], 〇〇Factory)` と並べ、`resolve()` した結果を `di` として export する
- `di.ts` は `@gyaku/di` と相対パスだけを import できる(ESLintで強制)
- routes・middlewares からは `di.〇〇` で使う

## routes(presentation)

- ログインが必要なルートは `loginRequiredMiddleware`/`adminRequiredMiddleware` を `middleware` に並べる
- フォームの入力は必ず conform-to(`parseWithZod`)で検証する。スキーマはフォームのコンポーネント(`features/**/blocks/*-container.tsx`)と共有する
- `app/server` は loader/action/middleware からだけ参照する。コンポーネントから参照するとクライアントバンドルにサーバーの処理が入る
