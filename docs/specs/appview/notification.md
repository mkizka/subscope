# AppView仕様: app.bsky.notification

## app.bsky.notification.listNotifications

閲覧者宛ての通知を返す。認証が必要。priorityは無視し、常に全件を返す。

- listNotifications-1: 認証がないリクエストには401を返す
- listNotifications-2: 閲覧者宛ての通知を新しい順に返す
- listNotifications-3: 既読時刻以前の通知は既読にし、それより後の通知は未読にする
- listNotifications-4: reasonsを指定すると、その種類の通知だけを返す
- listNotifications-5: seenAtに閲覧者の既読時刻を返す

## app.bsky.notification.getGroupedNotifications

閲覧者宛ての通知を、まとめた形で返す。認証が必要。公式アプリの通知画面はこのAPIだけを使う。

まとめるのは1ページ内の通知だけで、ページをまたいだ同じ投稿へのいいねは別のグループになる。

`feed=people-i-follow`は実装しない。「すべて」タブの通知をフォロー中のアカウントに絞るだけのフィルターで、501を返しても通知という基本機能は欠けないため、基本機能の再現を優先するPoCの方針で見送る。

- getGroupedNotifications-1: 認証がないリクエストには401を返す
- getGroupedNotifications-2: 同じ投稿へのいいねとリポストは種類ごとに1つのグループにまとめる
- getGroupedNotifications-3: フィードジェネレーターへのいいねは、フィードジェネレーターごとに1つのグループにまとめる
- getGroupedNotifications-4: フォローは1つのグループにまとめる
- getGroupedNotifications-5: 返信・引用・メンションはまとめずに1件ずつ返す
- getGroupedNotifications-6: relatedViewsに、グループが参照するアカウントと投稿とフィードジェネレーターのビューを返す
- getGroupedNotifications-7: グループの中で最新の通知が既読時刻以前なら、グループを既読にする
- getGroupedNotifications-8: feedにconversationsを指定すると返信・引用・メンションだけを、followersを指定するとフォローだけを返す
- getGroupedNotifications-9: feedにpeople-i-followかactivityを指定すると、501とMethodNotImplementedを返す

## app.bsky.notification.getUnreadCount

閲覧者宛ての未読通知の数を返す。認証が必要。priorityは無視する。

- getUnreadCount-1: 認証がないリクエストには401を返す
- getUnreadCount-2: 既読時刻より新しい通知の数を返す
- getUnreadCount-3: seenAtを指定すると、保存した既読時刻の代わりにseenAtより新しい通知の数を返す

## app.bsky.notification.updateSeen

閲覧者の既読時刻を更新する。認証が必要。

- updateSeen-1: 認証がないリクエストには401を返す
- updateSeen-2: 指定した時刻以前の通知を既読にする
