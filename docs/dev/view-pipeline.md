# appviewのビュー生成(Loader、VisibilityFilter、ViewBuilder)

appviewはXRPCの応答に含めるビュー(profileView、postViewなど)を、次の3段階で作る。

1. Loaderがデータを集める
2. VisibilityFilterが表示してよいデータだけを残す
3. ViewBuilderがlexiconの形にする

## Loader

`apps/appview/src/application/loader/` に置く。

- ビューに必要なデータとラベルをリポジトリから集め、ViewDataにまとめる
- 同じ種類のデータは1回のクエリでまとめて取得する
- 表示してよいかの判定はしない

## VisibilityFilter

`apps/appview/src/application/visibility/` に置く。

- ViewDataからテイクダウンされたアカウントや投稿を除く
- 判定はここだけで行う。管理画面などの例外は `includeTakedowns` で切り替える
- リポジトリにはアクセスしない

## ViewBuilder

- ViewDataをlexiconの形に変換するだけにする
- リポジトリへのアクセスや、表示してよいかの判定は持たない
- ViewDataに無いデータのビューは作らない
