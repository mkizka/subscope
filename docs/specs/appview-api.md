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

## app.bsky.graph.getFollowers

指定したアクターをフォローしているアクターを返す。認証は任意。

- getFollowers-1: フォロワーがいるアクターを指定した場合、そのアクターをsubject、フォロワーのprofileViewをfollowersとして返す

## app.bsky.graph.getFollows

指定したアクターがフォローしているアクターを返す。認証は任意。

- getFollows-1: フォローしているアクターを指定した場合、そのアクターをsubject、フォロー先のprofileViewをfollowsとして返す
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
