# appviewのビュー生成(hydrator と views)

appviewはXRPCの応答に含めるビュー(profileView、postViewなど)を、hydratorとviewsの2段階で作る。

## hydrator

`apps/appview/src/application/hydration/` に置く。

- ビューに必要なデータをリポジトリから集め、HydrationStateにまとめる
- 同じ種類のデータは1回のクエリでまとめて取得する
- テイクダウンの判定はhydratorだけで行い、テイクダウンされたアカウントや投稿はHydrationStateに入れない
- 判定の例外(管理画面など)は `HydrateCtx.includeTakedowns` で切り替える

## views

- HydrationStateを受け取り、lexiconの形に変換するだけにする
- リポジトリへのアクセスや、表示してよいかの判定は持たない
- HydrationStateに無いデータのビューは作らない
