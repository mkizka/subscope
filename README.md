# Subscope

保存するデータを限定することで小規模なBluesky互換Appviewを実装する試み

Subscribe & Scoped Appview = Subscope

## アイデア

ActivityPub実装のようにフォローしているアカウントやその関連データのみを保存することでストレージ容量を節約します。

4Core/4GB/100GB程度の一般的なVPSでのセルフホスティングを可能するのが目標です。

詳細は[spec.md](./docs/spec.md)を参照してください。

## システム構成

appsディレクトリ以下に各サーバー実装があります。

- admin ... 招待コードやサブスクライバーを管理する画面
- appview ... クライアント向けXRPC API
- ingester ... Jetstreamイベントを受信してジョブ追加
- worker ... Jetstreamイベントを処理するワーカー
- blob-proxy ... PDSに保存されたBlobのプロキシ

## デプロイ方法

未定。Railwayまたはdocker composeで起動出来る設定を追加予定です。

## 開発方法

Node.js, Dockerが必要です。以下コマンドで開発サーバーを起動できます。

```
cp packages/db/.env.example packages/db/.env
corepack enable pnpm
pnpm i
pnpm dev
```

以下のサーバーが起動します。adminのみOAuth認証のために以下のようにアクセスする必要があります。

- admin ... http://admin.localhost:3000
- appview ... http://localhost:3001
- ingester ... http://localhost:3002
- worker ... http://localhost:3003
- blob-proxy ... http://localhost:3004
- 開発用PDS ... http://localhost:2583
