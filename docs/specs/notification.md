# 通知

## 通知の生成

- 通知はworkerがレコードをインデックスするときに生成する
- 通知を受け取るのはサブスクライバーのみ
- 自分自身の操作では通知しない
- 対応するreasonは以下のみ

| reason  | 生成元                  | 受信者                                       |
| ------- | ----------------------- | -------------------------------------------- |
| like    | `app.bsky.feed.like`    | いいねされた投稿の作者                       |
| repost  | `app.bsky.feed.repost`  | リポストされた投稿の作者                     |
| follow  | `app.bsky.graph.follow` | フォローされたアカウント                     |
| reply   | `app.bsky.feed.post`    | 親投稿と、保存済みの投稿でたどれる祖先の作者 |
| quote   | `app.bsky.feed.post`    | 引用された投稿の作者                         |
| mention | `app.bsky.feed.post`    | メンションされたアカウント                   |

- 1つの投稿から同じ受信者への通知は reply > quote > mention の優先順で1件にする
- notification-1: リプライ通知は、親投稿を含めて4つ上の投稿まで保存済みの投稿をたどり、その作者に送る。未保存の投稿に当たったら打ち切る

## API

- `app.bsky.notification.listNotifications`
  - `reasons` で通知の種類を絞り込める
  - レスポンスの `seenAt` はサブスクライバーの既読時刻を返す
  - `priority` は無視し、常に全件を返す
- `app.bsky.notification.getUnreadCount`
  - `seenAt` パラメータがあればその時刻、なければ `updateSeen` で保存した既読時刻より後の通知を数える
  - `priority` は無視する
- `app.bsky.notification.updateSeen`
  - サブスクライバーの既読時刻を更新する

## v1.0 の対象外

- 追跡アクター以外からの通知
  - Tapから受信しないため届かない。v1.0後に検討する
- 上記以外のreason（starterpack-joined、verified、like-via-repost、subscribed-postなど）
- 通知設定（`getPreferences` / `putPreferencesV2`）
- スレッドのミュート、ミュート・ブロックによる通知の除外
