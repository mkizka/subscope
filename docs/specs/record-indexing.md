# レコードのインデックス

## 用語の定義

- サブスクライバー
  - AppViewに登録したアカウント
  - 変数名の例：`subscriber`
- 追跡アクター
  - サブスクライバーまたはサブスクライバーのフォロイー
  - 変数名の例：`trackedActor`
- 招待コード
  - AppViewが発行し、subscriptionの作成時にレコードに含める
  - 形式は`{AppViewドメインをケバブケースにした文字列}-{ランダムな5文字}`
  - 変数名の例：`inviteCode`

## アカウントの登録からタイムラインが見れるようになるまで

1. AppViewの管理者が招待コードを発行する
2. ユーザーが招待コードをつけてme.subsco.sync.subscribeServerへリクエスト
3. 招待コードが有効な場合、AppView上にユーザーが登録されサブスクライバーになる
4. サブスクライバーのPDSレコードをバックフィルし、フォロー関係を含むレコード情報が保存される
5. Jetstreamイベントから「レコードのインデックスポリシー」の条件でサブスクライバーに関連するレコードを保存する
6. app.bsky.feed.getTimelineがタイムラインを返すようになる

### フォロー保存時の処理

## レコードのインデックスポリシー

レコードは条件に基づいてサブスクライバーに関係があるレコードのみ保存する。

| NSID                             | 保存条件                                                     |
| -------------------------------- | ------------------------------------------------------------ |
| app.bsky.feed.post               | 追跡アカウントの投稿                                         |
| app.bsky.feed.post<br>(リプライ) | 追跡アカウントのリプライ<br>サブスクライバーへのリプライ     |
| app.bsky.feed.repost             | 追跡アカウントのリポスト<br>追跡アカウントの投稿へのリポスト |
| app.bsky.feed.like               | 追跡アカウントのいいね<br>追跡アカウントへの投稿へのいいね   |
| app.bsky.graph.follow            | サブスクライバーのフォロー<br>サブスクライバーへのフォロー   |
| app.bsky.actor.profile           | 追跡アカウントのプロフィール                                 |
| app.bsky.feed.generator          | 追跡アカウントのフィード                                     |

さらに、以下はPDSにリクエストを送って追加で保存する。再帰処理になる場合の連鎖は2回まで。

- app.bsky.feed.postがembedしているレコード
- app.bsky.feed.repostがリポストしたレコード
- 保存条件に一致したレコードを作成したアカウントのapp.bsky.actor.profile

## レコード保存時の処理

1. 保存ルールをチェックし、該当しなければ何もしない
2. didに基づいてactorをDBに保存(このときprofileが無ければfetchRecordにジョブ追加)
3. identityイベントなどhandleがすぐ分からなければresolveDidをジョブキューに追加
4. actorのapp.bsky.actor.profileがDBになければfetchProfileをジョブキューに追加
5. recordをDBに保存
6. コレクションごとのデータをDBに保存
