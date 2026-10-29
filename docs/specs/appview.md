# AppView仕様

AppViewが提供するXRPC API（Blueskyの標準APIと独自API）の振る舞いを定める。レスポンスは常にlexiconに適合する。

## app.bsky.actor.getProfile

指定したアクターの詳細なプロフィールを返す。認証は任意。

- getProfile-1: 指定したアクターのprofileViewDetailedを返す
- getProfile-2: 保存されていないアクターには400を返す

## app.bsky.actor.getProfiles

指定した複数アクターの詳細なプロフィールを返す。認証は任意。

- getProfiles-1: DIDとハンドルのどちらでも指定でき、見つかったアクターだけを指定した順に返す

## app.bsky.actor.searchActors

表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActors-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewで返す

## app.bsky.actor.searchActorsTypeahead

入力補完用に、表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActorsTypeahead-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewBasicで返す

## app.bsky.actor.getPreferences

閲覧者の設定を返す。設定の保存には対応していないため、固定の設定を返す。

- getPreferences-1: Followingフィードをピン留めした設定を返す

## app.bsky.feed.getTimeline

閲覧者のホームタイムラインを新しい順に返す。認証が必要。

- getTimeline-1: 認証がない場合、401を返す
- getTimeline-2: フォロイーの投稿がある場合、その投稿をfeedViewPostとして返す

## app.bsky.feed.getListFeed

指定したリストのメンバーの投稿とリポストを新しい順に返す。認証は任意。

- getListFeed-1: リストのメンバーとメンバー以外の投稿がある場合、メンバーの投稿のみをfeedViewPostとして返す

## app.bsky.feed.getActorLikes

指定したアクターがいいねした投稿を新しい順に返す。認証は任意。

- getActorLikes-1: いいねした投稿がある場合、その投稿をfeedViewPostとして返す

## app.bsky.feed.getLikes

指定した投稿へのいいねを新しい順に返す。認証は任意。

- getLikes-1: いいねがある場合、いいねしたアクターのprofileViewを返す

## app.bsky.feed.getRepostedBy

指定した投稿をリポストしたアクターを新しい順に返す。認証は任意。

- getRepostedBy-1: リポストがある場合、リポストしたアクターのprofileViewを返す

## app.bsky.feed.getFeedGenerators

指定したフィードジェネレーターの情報を返す。認証は任意。

- getFeedGenerators-1: 存在するフィードジェネレーターを指定した場合、そのgeneratorViewを返す

## app.bsky.feed.searchPosts

本文が検索クエリに一致する投稿を新しい順に返す。認証は任意。

- searchPosts-1: クエリに一致する投稿がある場合、その投稿をpostViewとして返す

## app.bsky.feed.getPosts

指定したURIの投稿をpostViewとして返す。認証は任意。

- getPosts-1: 複数のURIを指定した場合、指定した順に投稿を返し、存在しない投稿は除外する

## app.bsky.feed.getPostThread

指定した投稿を中心に、親投稿とリプライを含むスレッドを返す。認証は任意。

- getPostThread-1: 親投稿とリプライがある投稿を指定した場合、それらを含むthreadViewPostを返す
- getPostThread-2: 存在しない投稿を指定した場合、400 NotFoundを返す

## app.bsky.feed.getAuthorFeed

指定したアクターの投稿とリポストを新しい順に返す。認証は任意。

- getAuthorFeed-1: アクターをハンドルで指定した場合、そのアクターの投稿をfeedViewPostとして返す
- getAuthorFeed-2: 解決できないハンドルを指定した場合、400を返す

## app.bsky.notification.listNotifications

閲覧者宛ての通知を新しい順に返す。認証が必要。

- listNotifications-1: 認証がない場合、401を返す
- listNotifications-2: 閲覧者宛ての通知がある場合、新しい順に返し、既読時刻以前の通知を既読にする
- listNotifications-3: reasonsを指定した場合、指定した種類の通知のみを返す
- listNotifications-4: 閲覧者の既読時刻がある場合、seenAtにその時刻を返す

## app.bsky.notification.getUnreadCount

閲覧者宛ての未読通知の数を返す。認証が必要。

- getUnreadCount-1: 認証がない場合、401を返す
- getUnreadCount-2: 閲覧者宛ての通知のうち、既読時刻より新しい通知の数を返す
- getUnreadCount-3: seenAtを指定した場合、保存済みの既読時刻ではなくseenAtより新しい通知の数を返す

## app.bsky.notification.updateSeen

閲覧者の既読時刻を更新する。認証が必要。

- updateSeen-1: 認証がない場合、401を返す
- updateSeen-2: 指定した時刻以前の通知を既読にする

## me.subsco.admin.verifyAccess

閲覧者の管理画面へのアクセス権を返す。認証が必要。statusは管理者が未登録なら `needsSetup`、閲覧者が管理者なら `authorized`、それ以外は `unauthorized` になる。

## me.subsco.admin.registerAdmin

管理者が未登録のとき、閲覧者を管理者として登録する。認証が必要。既に管理者がいる場合は400とAdminAlreadyExistsを、閲覧者のアクターがない場合は400とActorNotFoundを返す。

## me.subsco.admin.deleteInviteCode

招待コードを削除する。管理者の認証が必要。

- deleteInviteCode-1: 存在しない招待コードを指定した場合、400とInviteCodeNotFoundを返す
- deleteInviteCode-2: 使用済みの招待コードを指定した場合、400とInviteCodeAlreadyUsedを返す

## app.bsky.graph.getFollowers

指定したアクターをフォローしているアクターを返す。認証は任意。

- getFollowers-1: 指定したアクターをsubjectに、そのフォロワーをfollowersにprofileViewで返す

## app.bsky.graph.getFollows

指定したアクターがフォローしているアクターを返す。認証は任意。

- getFollows-1: 指定したアクターをsubjectに、そのフォロー先をfollowsにprofileViewで返す

## app.bsky.graph.getList

指定したリストとそのリストに追加されたアクターを返す。認証は任意。

- getList-1: 指定したリストのlistViewと、リストに追加されたアクターのprofileViewをitemsで返す
- getList-2: 保存されていないリストには400を返す

## app.bsky.graph.getLists

指定したアクターが作成したリストを返す。認証は任意。

- getLists-1: 指定したアクターが作成したリストをlistViewで返す
- getLists-2: purposesを指定すると、その用途のリストだけを返す
