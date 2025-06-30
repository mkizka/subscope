# 仕様

コンセプト：ActivityPubを参考に登録データを限定し、DBサイズを抑えられるAppview

## 1. コンセプト仕様

### アカウントの登録からタイムラインが見れるようになるまで

- なんらかの手段でdev.mkizka.test.subscriptionレコードを作成
  - レコードにはAppViewのDIDが入っている
  - did:web:api.bsky.app#bsky_appview のような
- Appviewがsubscriptionレコードを監視してsubscribersテーブルに保存
  - subscribersになったユーザーのPDSからフォローレコードを全取得
    - バックフィル仕様に記載
  - 取得処理は時間がかかるのでbullmqジョブにする
  - ジョブの実行状況を見られるqueryも用意する
- 後述の条件でフォロイーの投稿が保存されるようになる

### レコードの保存ルール

- app.bsky.feed.post
- app.bsky.feed.repost
  - subscribers本人、または投稿者のフォロワーが1人以上subscribersなら保存
  - embedがある場合はfetchRecordにそのレコードを取得するジョブを追加
- app.bsky.feed.post(リプライ)
  - subscribers本人、またはリプライ先またはツリー先の投稿がDB上にあれば保存
- app.bsky.feed.like
  - いいねしたユーザー、またはいいねされた投稿のフォロワーが1人以上subscribersなら保存
- app.bsky.graph.follow
  - フォローまたはフォロイーがsubscribersなら保存
- app.bsky.actor.profile
  - subscribers本人なら保存
- app.bsky.feed.generator
  - subscriber本人なら保存
- dev.mkizka.test.subscription
  - appviewDidが環境変数APPVIEW_DIDと一致なら保存

### レコード保存時の処理

1. 保存ルールをチェックし、該当しなければ何もしない
2. didに基づいてactorをDBに保存(このときprofileが無ければfetchRecordにジョブ追加)
3. identityイベントなどhandleがすぐ分からなければresolveDidをジョブキューに追加
4. actorのapp.bsky.actor.profileがDBになければfetchProfileをジョブキューに追加
5. recordをDBに保存
6. コレクションごとのデータをDBに保存

## 2. バックフィル

subscriptionレコードをインデックスする際に、レコードを作成したactorのバックフィルステータスがdirtyならバックフィルする

### バックフィルの処理手順(バージョン1)

1. actorのステータスをin-processに
2. subscribersになったユーザーのPDSからレコード一覧を取得
3. レコード一覧の中から以下のレコードを一括保存
4. バックフィルの状況はdev.mkizka.test.getJobStatusで確認出来る。クライアントは定期的にポーリングする
5. actorのステータスをsynchronizedにする

## バックフィルステータスの定義

- dirty ... 同期されていない
- in-process ... バックフィルのバックグラウンドタスクが進行中
- synchronized ... バックフィル完了

## バックフィルのバージョン定義

今後バックフィルロジックを更新することを踏まえてバックフィルにバージョンを付与する。
actorはバックフィルステータスとバックフィル時のバージョンを保存する。現在のバージョンは1。
