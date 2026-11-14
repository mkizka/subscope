# AppView仕様: XRPC対応一覧

AppViewが提供するXRPC API（Blueskyの標準APIと独自API）の振る舞いを定める。レスポンスは常にlexiconに適合する。

## XRPC対応一覧

v1での各XRPCの対応状況。対応は公式AppViewと同じ振る舞いをするもの、一部対応は一部のパラメーターや項目を見送るもの、見送りは実装しないと決めて501を返すもの、未対応は一覧にないXRPCで同じく501を返すもの。

### 標準のXRPC

| XRPC                                                                                                            | 状況     | 備考                                                  |
| --------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| app.bsky.actor.getProfile / getProfiles / searchActors / searchActorsTypeahead                                  | 対応     |                                                       |
| app.bsky.actor.getPreferences                                                                                   | 一部対応 | 設定の保存はせず固定の設定を返す                      |
| app.bsky.feed.getTimeline / getAuthorFeed / getActorLikes / getListFeed                                         | 対応     |                                                       |
| app.bsky.feed.getPosts / getPostThread / getQuotes / getLikes / getRepostedBy / getFeedGenerators / searchPosts | 対応     |                                                       |
| app.bsky.feed.searchPostsV2                                                                                     | 一部対応 | 一部のパラメーターを無視する(下記)                    |
| app.bsky.unspecced.getPostThreadV2                                                                              | 一部対応 | sortとhiddenRepliesを無視する(下記)                   |
| app.bsky.notification.listNotifications / getUnreadCount                                                        | 一部対応 | priorityを無視する(下記)                              |
| app.bsky.notification.getGroupedNotifications                                                                   | 一部対応 | `feed=people-i-follow`と`feed=activity`は見送り(下記) |
| app.bsky.notification.updateSeen                                                                                | 対応     |                                                       |
| app.bsky.graph.getFollowers / getFollows / getKnownFollowers / getList / getLists / getListsWithMembership      | 対応     |                                                       |
| app.bsky.bookmark.*                                                                                             | 見送り   | `viewer.bookmarked`と`bookmarkCount`も返さない        |
| app.bsky.draft.*                                                                                                | 見送り   |                                                       |
| app.bsky.notification.getPreferences / putPreferencesV2 / putActivitySubscription                               | 見送り   |                                                       |
| app.bsky.labeler.getServices                                                                                    | 見送り   |                                                       |
| app.bsky.graph.getBlocks、ブロックの反映                                                                        | 見送り   | 下記                                                  |
| 上記以外のapp.bsky.*                                                                                            | 未対応   | 501を返す(例: app.bsky.feed.getFeed)                  |

### 独自のXRPC

me.subsco.*はすべて対応している。各XRPCの振る舞いは[subsco.md](./subsco.md)を参照する。

### ブロック

ブロックはv1に入れない。ブロックレコードのインデックス、`viewer.blocking`と`viewer.blockedBy`、ブロック相手の投稿の非表示、`app.bsky.graph.getBlocks`はいずれも対応しない。v1の範囲を絞るための判断で、ブロックしたアカウントも通常どおり表示される。

## 未実装のAPI

v1で対応しないXRPCやパラメータには、空の応答で成功を装わずエラーを返す。空の応答だと、クライアントは「データが無い」と区別できないため。

- notImplemented-1: 実装していないXRPCには501とMethodNotImplementedを返す

対応一覧で見送りとしたXRPCは、実装する予定がない。理由は2つある。

- どれもSNSを便利にする機能で、基本機能の再現というPoCの目標に入らない。
- PDSにない利用者の非公開データをAppViewのDBに保管する必要があり、保管するデータを増やしたくない。

ブックマークは自分だけが見る非公開の保存リストで、無くても基本体験は変わらない。そのため見送る。公式クライアントでブックマークボタンを押すとエラーになり、ブックマーク一覧も開けない。

`app.bsky.labeler.getServices`も実装せず、501を返す。SNSを便利にする機能で、基本機能の再現というPoCの目標に入らないため。テイクダウン、ラベルによる非表示、`atproto-accept-labelers`ヘッダーへの対応は`getServices`が無くても動き、標準ラベルの定義は公式クライアントが持つ。`getServices`が足すのは、ラベラーのプロフィール画面、独自ラベルの説明、ラベルごとの表示設定だけである。ラベラーのserviceレコードは、保存範囲（追跡アカウント）の外にもある。
