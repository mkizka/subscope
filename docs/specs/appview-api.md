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
