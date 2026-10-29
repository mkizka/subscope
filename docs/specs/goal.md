# プロジェクトのゴール

## v1.0 完成の定義

以下をすべて満たした時点で v1.0 とする。

1. **セルフホストできる**
   - 4コア / 4GB RAM / 100GB ストレージ程度の VPS に Docker Compose でデプロイできる
   - デプロイ手順が docs/user/deploy.md にある
2. **Web クライアントで SNS として使える**
   - apps/web が Bluesky クライアント相当の機能を持つ（[Webクライアント仕様](./web-client.md)）
   - 公式 Bluesky アプリで AppView を Subscope に向けた場合も同等に使える
3. **管理者が Web 画面から運用できる**
   - 招待コードの管理（[管理画面仕様](./web-admin.md)）

## v1.0 に必要なバックエンドの追加実装

Web クライアントの v1 機能を満たすため、以下を実装する。

- 通知
  - `app.bsky.notification.listNotifications`
  - `app.bsky.notification.getUnreadCount`
  - `app.bsky.notification.updateSeen`
- リスト
  - `app.bsky.graph.list` / `app.bsky.graph.listitem` のインデックス
  - `app.bsky.graph.getList` / `app.bsky.graph.getLists` / `app.bsky.feed.getListFeed`

## v1.0 の対象外

- カスタムフィード
- ブロック・ミュート
- DM
- モデレーションラベル
- スターターパック
