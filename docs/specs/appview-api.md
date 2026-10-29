# AppView API仕様

AppViewが提供するXRPC APIの振る舞いを定める。

- レスポンスは常にlexiconに適合する
- 各項目にはIDを振り、APIテストはテスト名の先頭にIDを書いてその項目を検証する
  - 例: `test("getTimeline-1: 認証がない場合、401を返す")`
- 仕様の追加・変更は、この文書を先に更新してからテストと実装を変更する

## app.bsky.actor.getProfile

指定したアクターの詳細なプロフィールを返す。認証は任意。

- getProfile-1: プロフィールがあるアクターを指定した場合、そのアクターのprofileViewDetailedを返す
- getProfile-2: 存在しないアクターを指定した場合、400を返す

## app.bsky.feed.getTimeline

閲覧者のホームタイムラインを新しい順に返す。認証が必要。

- getTimeline-1: 認証がない場合、401を返す
- getTimeline-2: フォロイーの投稿がある場合、その投稿をfeedViewPostとして返す

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

## app.bsky.notification.getUnreadCount

閲覧者宛ての未読通知の数を返す。認証が必要。

- getUnreadCount-1: 認証がない場合、401を返す
- getUnreadCount-2: 閲覧者宛ての通知のうち、既読時刻より新しい通知の数を返す

## app.bsky.notification.updateSeen

閲覧者の既読時刻を更新する。認証が必要。

- updateSeen-1: 認証がない場合、401を返す
- updateSeen-2: 指定した時刻以前の通知を既読にする

## app.bsky.actor.getProfiles

指定した複数アクターの詳細なプロフィールを返す。認証は任意。

- getProfiles-1: DIDとハンドルを混在して指定した場合、解決できたアクターのprofileViewDetailedを指定順に返す

## app.bsky.actor.searchActors

表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActors-1: 表示名が検索語に部分一致するアクターがある場合、そのアクターのprofileViewを返す

## app.bsky.actor.searchActorsTypeahead

入力補完用に、表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActorsTypeahead-1: 表示名が検索語に部分一致するアクターがある場合、そのアクターのprofileViewBasicを返す

## app.bsky.actor.getPreferences

閲覧者の設定を返す。現在は固定値を返す。

- getPreferences-1: Followingフィードをピン留めした設定を返す
