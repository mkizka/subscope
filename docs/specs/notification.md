# 通知

通知の生成は[Worker仕様](./worker.md)を参照する。

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

- 通知設定（`getPreferences` / `putPreferencesV2`）
- スレッドのミュート、ミュート・ブロックによる通知の除外
