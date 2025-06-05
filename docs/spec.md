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

- post, repost
  - subscribers本人、または投稿者のフォロワーが1人以上subscribersなら保存
- post(リプライ)
  - subscribers本人、またはリプライ先またはツリー先の投稿がDB上にあれば保存
- like
  - いいねしたユーザー、またはいいねされた投稿のフォロワーが1人以上subscribersなら保存
- follow
  - フォローまたはフォロイーがsubscribersなら保存
- profile
  - subscribers本人なら保存

### レコード保存時の処理

1. 保存ルールをチェックし、該当しなければ何もしない
2. didに基づいてactorをDBに保存
3. identityイベントなどhandleがすぐ分からなければresolveDidをジョブキューに追加
4. actorがdirtyであればbackfillをジョブキューに追加
5. recordをDBに保存
6. コレクションごとのデータをDBに保存

## 2. バックフィル

### バックフィルの処理手順(バージョン1)

1. actorのステータスをin-processに
2. subscribersになったユーザーのPDSからレコード一覧を取得
3. レコード一覧の中から以下のレコードを一括保存(※)
4. バックフィルの状況はdev.mkizka.test.getJobStatusで確認出来る。クライアントは定期的にポーリングする
5. actorのステータスをsynchronizedにする

(※)subscriberの場合はサポートしている全コレクション、それ以外はapp.bsky.actor.profileのみ保存する。

## バックフィルステータスの定義

- dirty ... 同期されていない
- in-process ... バックフィルのバックグラウンドタスクが進行中
- synchronized ... バックフィル完了

## バックフィルのバージョン定義

今後バックフィルロジックを更新することを踏まえてバックフィルにバージョンを付与する。
actorはバックフィルステータスとバックフィル時のバージョンを保存する。現在のバージョンは1。
