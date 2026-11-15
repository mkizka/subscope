# AppView仕様: XRPC対応一覧

AppViewが提供するXRPC（Blueskyの標準のものと独自のもの）の対応状況を定める。レスポンスは常にlexiconに適合する。

## XRPC対応一覧

v1での各XRPCの対応状況。状況の意味は次のとおり。

| 状況     | 意味                              |
| -------- | --------------------------------- |
| 対応     | 公式AppViewと同じように動く       |
| 一部対応 | 一部のパラメーターや項目を見送る  |
| 見送り   | 実装しないと決めたもの。501を返す |
| 未対応   | 一覧にないもの。501を返す         |

### 標準のXRPC

| XRPC                                                                                                            | 状況     | 備考                                               |
| --------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| app.bsky.actor.getProfile / getProfiles / searchActors / searchActorsTypeahead                                  | 対応     |                                                    |
| app.bsky.actor.getPreferences                                                                                   | 一部対応 | 設定を保存せず、決まった設定を返す                 |
| app.bsky.feed.getTimeline / getAuthorFeed / getActorLikes / getListFeed                                         | 対応     |                                                    |
| app.bsky.feed.getPosts / getPostThread / getQuotes / getLikes / getRepostedBy / getFeedGenerators / searchPosts | 対応     |                                                    |
| app.bsky.feed.searchPostsV2                                                                                     | 一部対応 | 一部のパラメーターを無視する                       |
| app.bsky.unspecced.getPostThreadV2                                                                              | 一部対応 | sortとhiddenRepliesを無視する                      |
| app.bsky.notification.listNotifications / getUnreadCount                                                        | 一部対応 | priorityを無視する                                 |
| app.bsky.notification.getGroupedNotifications                                                                   | 一部対応 | フォロー中の人の通知とアクティビティの通知は見送る |
| app.bsky.notification.updateSeen                                                                                | 対応     |                                                    |
| app.bsky.graph.getFollowers / getFollows / getKnownFollowers / getList / getLists / getListsWithMembership      | 対応     |                                                    |
| app.bsky.bookmark.*                                                                                             | 見送り   | 投稿のブックマーク状態とブックマーク数も返さない   |
| app.bsky.draft.*                                                                                                | 見送り   |                                                    |
| app.bsky.notification.getPreferences / putPreferencesV2 / putActivitySubscription                               | 見送り   |                                                    |
| app.bsky.labeler.getServices                                                                                    | 見送り   |                                                    |
| app.bsky.graph.getBlocks、ブロックの反映                                                                        | 見送り   | 下記                                               |
| 上記以外のapp.bsky.*                                                                                            | 未対応   | 例: app.bsky.feed.getFeed                          |

### 独自のXRPC

me.subsco.*はすべて対応している。振る舞いは[subsco.md](./subsco.md)に書く。

### 見送りの理由

見送りとしたXRPCは実装する予定がない。どれもSNSを便利にする機能で、基本機能の再現というPoCの目標に入らないため。加えて、ブックマークや通知設定のような利用者の非公開データはPDSになく、AppViewで保管する必要がある。保管するデータは増やしたくない。

| 機能         | 理由                                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ブックマーク | 自分だけが見る保存リストで、無くても基本の体験は変わらない。公式クライアントではブックマークボタンがエラーになり、一覧も開けない                                                                                                                               |
| ラベラー     | テイクダウン、ラベルによる非表示、ラベラー指定のヘッダーはこのXRPCが無くても動き、標準ラベルの定義は公式クライアントが持つ。足りなくなるのは、ラベラーのプロフィール画面、独自ラベルの説明、ラベルごとの表示設定だけ。ラベラーのレコードは保存範囲の外にもある |
| ブロック     | v1の範囲を絞るため。ブロックのインデックス、ブロック状態の返却、ブロック相手の投稿の非表示はどれもせず、ブロックしたアカウントも普通に表示される                                                                                                               |

## 未実装のAPI

v1で対応しないXRPCには、空の応答で成功を装わずエラーを返す。空の応答では、クライアントが「データが無い」と区別できないため。

| ID               | 仕様                                                  |
| ---------------- | ----------------------------------------------------- |
| notImplemented-1 | 実装していないXRPCには501とMethodNotImplementedを返す |
