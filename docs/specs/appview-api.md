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
