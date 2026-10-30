---
name: web-server
description: "apps/webのサーバー側処理(loader/action、middleware、OAuth、DI)を実装・変更するときに使用する。「webに画面を追加」「loader/actionを実装」「webのAPIルートを追加」「webのフォームを作る」などのタスクで発動する。"
---

# apps/web のサーバー構成

routes の loader/action はできるだけ薄くし、処理は `apps/web/app/server` 以下にオニオンアーキテクチャで置く。

## 層

| 層             | パス                                                            | 置くもの                                                                                      |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| domain         | `app/server/domain/`                                            | ライブラリに依存しないルール(文字数上限、選択肢の検証など)                                    |
| application    | `app/server/application/use-cases/{feature}/{name}-use-case.ts` | 画面1つ・操作1つごとのユースケース。PDSへのXRPC呼び出しと、画面が使う形への変換               |
| application    | `app/server/application/interfaces/`                            | ユースケースが使うinfrastructureのinterface                                                   |
| infrastructure | `app/server/infrastructure/`                                    | OAuthクライアント、Cookieセッション、DB、ジョブキューなど外部とのやりとり                     |
| shared         | `app/server/shared/env.ts`, `app/server/shared/registry.ts`     | 環境変数とDIの配線                                                                            |
| presentation   | `app/routes/`, `app/middlewares/`                               | 入力の検証、ユースケースの呼び出し、`data`/`redirect`での応答。React Routerの制約でここに置く |

依存の向きは presentation → application → domain とし、application は infrastructure を interface 経由でのみ使う。

## ユースケース

- クラスで書き、`execute` の第1引数にログイン中ユーザーの `Client`(`@atproto/lex`)を受け取る。`Client` はリクエストごとに作られるのでDIせず引数で渡す
- 戻り値は画面が使うプレーンなオブジェクトにする。`Request` や `data` などReact Routerのものは使わない

```ts
export class GetTrackedActorsUseCase {
  async execute(agent: Client) {
    const { trackedActors, total } = await agent.call(getTrackedActors, { limit: 100 });
    return { total, actors: trackedActors.map(...) };
  }
}
```

## DIの配線

- `app/server/shared/registry.ts` に `@gyaku/di` で登録する。registryは `@gyaku/di`・`@repo/*`・相対パスのみimportできる(ESLintで強制)
- ライブラリのクラスは registry に登録せず、自前のクラスで private に包む(例: `OAuthClient` は `NodeOAuthClient` を包む)。非同期の初期化が必要なら、包んだクラスを返す `create〇〇` 関数を `asFunctionArgs` で登録する
- 解決済みのサービスは `app/server/index.ts` の `services` から使う

## routes(presentation)

- ログインが必要なルートは `loginRequiredMiddleware`/`adminRequiredMiddleware` を付け、`context.get(agentContext)` で `Client` を取り出してユースケースに渡す
- フォームの入力は必ず conform-to(`parseWithZod`)で検証する。スキーマはフォームのコンポーネント(`features/**/blocks/*-container.tsx`)と共有する
- `app/server` は loader/action/middleware からだけ参照する。コンポーネントから参照するとクライアントバンドルにサーバーの処理が入る
