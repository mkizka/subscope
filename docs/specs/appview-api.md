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
- getProfile-3: プロフィールレコードがないアクターを指定した場合、DIDとハンドルだけのprofileViewDetailedを返す

## app.bsky.feed.getTimeline

閲覧者のホームタイムラインを新しい順に返す。認証が必要。

- getTimeline-1: 認証がない場合、401を返す
- getTimeline-2: フォロイーの投稿がある場合、その投稿をfeedViewPostとして返す
- getTimeline-3: 投稿者にプロフィールレコードがない場合も、その投稿をDIDとハンドルだけのauthorで返す
