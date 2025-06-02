# 仕様

コンセプト：ActivityPubを参考に登録データを限定し、DBサイズを抑えられるAppview

## アカウントの登録からタイムラインが見れるようになるまで

- なんらかの手段でdev.mkizka.test.subscriptionレコードを作成
  - レコードにはAppViewのDIDが入っている
  - did:web:api.bsky.app#bsky_appview のような
- Appviewがsubscriptionレコードを監視してsubscribersテーブルに保存
  - subscribersになったユーザーのPDSからフォローレコードを全取得
  - 取得処理は時間がかかるのでbullmqジョブにする
  - ジョブの実行状況を見られるqueryも用意する
- 後述の条件でフォロイーの投稿が保存されるようになる

## レコードの保存ルール

- post, repost ... subscribers本人、または投稿者のフォロワーが1人以上subscribersなら保存
- post(リプライ) ... subscribers本人、またはリプライ先またはツリー先の投稿がDB上にあれば保存
- like ... いいねしたユーザー、またはいいねされた投稿のフォロワーが1人以上subscribersなら保存
- follow ... フォローまたはフォロイーがsubscribersなら保存
- profile ... subscribers本人なら保存
