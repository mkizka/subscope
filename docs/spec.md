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
- 後述の条件で限られたsubscribersに関係があるレコードのみを保存する

### レコードの保存ルール

レコードは条件に基づいてsubscribersに関係があるレコードのみ保存する。ただしINDEX_LEVEL環境変数によって保存範囲を調整できる。

| NSID                             | INDEX_LEVEL=1                                                                                 | INDEX_LEVEL=2（追加分）                 |
| -------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| app.bsky.feed.post               | subscribersの投稿<br>subscribersのフォロイーの投稿                                            | なし                                    |
| app.bsky.feed.post<br>(リプライ) | subscribersのリプライ<br>subscribersへのリプライ                                              | subscribersのフォロイーへのリプライ     |
| app.bsky.feed.repost             | subscribersのリポスト<br>subscribersのフォロイーのリポスト<br>subscribersのポストへのリポスト | 保存された投稿へのリポスト              |
| app.bsky.feed.like               | subscribersのいいね<br>subscribersのポストへのいいね                                          | subscribersのフォロイーの投稿へのいいね |
| app.bsky.graph.follow            | フォローまたはフォロイーがsubscribers                                                         | なし                                    |
| app.bsky.actor.profile           | subscribersのプロフール                                                                       | なし                                    |
| app.bsky.feed.generator          | subscribersのフィード                                                                         | なし                                    |
| dev.mkizka.test.subscription     | appviewDidが環境変数APPVIEW_DIDと一致                                                         | なし                                    |

さらに、以下はPDSにリクエストを送って追加で保存する。再帰処理になる場合の連鎖は2回まで。

- app.bsky.feed.postがembedしているレコード
- app.bsky.feed.repostがリポストしたレコード
- 保存条件に一致したレコードを作成したアカウントのapp.bsky.actor.profile

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
