---
name: pr-review
description: PRを作成・更新する前に必ず実行する。mainとの差分を読み、設計ルールに反する箇所がないかレビューする。
---

`git diff origin/main...HEAD` を読み、以下に反する箇所があれば修正してからPRを作成・更新する。

## DIの依存はライブラリを差し替えられる形にする

ライブラリを差し替えたいときに、修正箇所をラッパークラス1つに限定するためのルール。

- registryに登録するサービスの型は、自前のinterfaceかクラスにする。ライブラリのクラスや型(`Keyv<number>`など)をそのまま登録・注入しない
- ラッパークラスはライブラリを継承せず、privateに保持する。継承するとライブラリのAPIが使う側に漏れ、差し替えられなくなる
- 使う側のコンストラクタ引数はinterfaceで受け取る
- テストではライブラリではなく `*.in-memory.ts` の実装を使う

例: `apps/worker/src/infrastructure/label-cursor-store/label-cursor-store.ts` は `ILabelCursorStore` を実装し、Keyvをprivateに持つ。

例外: `db`(drizzle)とexpressのRouterは許容する。dbを使うのはinfrastructureのリポジトリだけで、差し替えの単位はリポジトリだから。Routerを使うのはpresentationのサーバークラスだけだから。

registryでのライブラリの直接importはESLintで禁止している。それ以外はESLintで判定できないので、このレビューで確認する。
