# AppView仕様: app.bsky.notification

## app.bsky.notification.listNotifications

閲覧者宛ての通知を返す。認証が必要。priorityは無視し、常に全件を返す。

| ID                  | 仕様                                             |
| ------------------- | ------------------------------------------------ |
| listNotifications-1 | 認証がないリクエストには401を返す                |
| listNotifications-2 | 閲覧者宛ての通知を新しい順に返す                 |
| listNotifications-3 | 既読時刻以前の通知を既読、それより後を未読にする |
| listNotifications-4 | reasonsを指定すると、その種類の通知だけを返す    |
| listNotifications-5 | seenAtに閲覧者の既読時刻を返す                   |

スレッド主が隠したリプライの通知は、公式AppViewと違い、スレッド主の一覧にも含める。リプライを隠す機能は、なくても通知という基本機能は欠けないため見送る。

## app.bsky.notification.getGroupedNotifications

閲覧者宛ての通知を、まとめた形で返す。認証が必要。公式アプリの通知画面はこのAPIだけを使う。

まとめるのは1ページ内の通知だけで、ページをまたいだ同じ投稿へのいいねは別のグループになる。

feedのpeople-i-followは実装しない。「すべて」タブをフォロー中のアカウントに絞るだけのフィルターで、なくても通知という基本機能は欠けないため見送る。

| ID                        | 仕様                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------ |
| getGroupedNotifications-1 | 認証がないリクエストには401を返す                                                    |
| getGroupedNotifications-2 | 同じ投稿へのいいねとリポストは、種類ごとに1つのグループにまとめる                    |
| getGroupedNotifications-3 | フィードジェネレーターへのいいねは、フィードジェネレーターごとにまとめる             |
| getGroupedNotifications-4 | フォローは1つのグループにまとめる                                                    |
| getGroupedNotifications-5 | 返信・引用・メンションはまとめずに1件ずつ返す                                        |
| getGroupedNotifications-6 | relatedViewsに、グループが参照するアカウント・投稿・フィードジェネレーターを返す     |
| getGroupedNotifications-7 | グループの最新の通知が既読時刻以前なら、グループを既読にする                         |
| getGroupedNotifications-8 | feedがconversationsなら返信・引用・メンションだけを、followersならフォローだけを返す |
| getGroupedNotifications-9 | feedがpeople-i-followかactivityなら、501とMethodNotImplementedを返す                 |

## app.bsky.notification.getUnreadCount

閲覧者宛ての未読通知の数を返す。認証が必要。priorityは無視する。

| ID               | 仕様                                                         |
| ---------------- | ------------------------------------------------------------ |
| getUnreadCount-1 | 認証がないリクエストには401を返す                            |
| getUnreadCount-2 | 既読時刻より新しい通知の数を返す                             |
| getUnreadCount-3 | seenAtを指定すると、保存した既読時刻の代わりにseenAtで数える |

## app.bsky.notification.updateSeen

閲覧者の既読時刻を更新する。認証が必要。

| ID           | 仕様                               |
| ------------ | ---------------------------------- |
| updateSeen-1 | 認証がないリクエストには401を返す  |
| updateSeen-2 | 指定した時刻以前の通知を既読にする |
