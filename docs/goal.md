# プロジェクトのゴール

## v1.0 完成の定義

以下をすべて満たした時点で v1.0 とする。

1. **セルフホストできる**
   - 4コア / 4GB RAM / 100GB ストレージ程度の VPS に Docker Compose でデプロイできる
   - デプロイ手順が docs/user/deploy.md にある
2. **Web クライアントで SNS として使える**
   - apps/web が Bluesky クライアント相当の機能を持つ（[v1 の機能](#v10-の-web-クライアントの機能)）
   - 公式 Bluesky アプリで AppView を Subscope に向けた場合も同等に使える
3. **管理者が Web 画面から運用できる**
   - 招待コード、サブスクライバーの管理（[管理画面仕様](./specs/admin-page.md)）

## v1.0 の Web クライアントの機能

### 認証・登録

- OAuth ログイン / ログアウト
- 招待コードによるサブスクライバー登録

### タイムライン・投稿

- ホームタイムライン（無限スクロール）
- 投稿作成（テキスト、画像、リプライ、引用）
- 投稿削除
- いいね / リポスト（取り消し含む）
- スレッド表示

### ユーザー

- プロフィール表示（投稿、リプライ、メディア、いいね）
- フォロー / フォロー解除
- フォロー一覧 / フォロワー一覧

### 通知

- 通知一覧（いいね、リポスト、リプライ、引用、メンション、フォロー）
- 未読数バッジ、既読化

### 検索

- 投稿検索
- ユーザー検索

### リスト

- リスト一覧 / リスト詳細
- リストのフィード表示
- リストの作成・編集・削除、メンバーの追加・削除

### 管理画面

- [管理画面仕様](./specs/admin-page.md) の機能を新 UI で実装

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
