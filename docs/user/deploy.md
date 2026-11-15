# デプロイ方法

SubscopeはRailwayかDocker Composeでセルフホストできます。

## Railway

PaaSの[Railway](https://railway.com/)にデプロイできます。Hobbyプラン以上のアカウントが必要です。

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/3u7GrK?referralCode=mveF9L)

1. 上のボタンを開き、「Deploy Now」を押す
2. 各アプリの「Configure」を押し、環境変数を入力して「Save Config」を押す
3. 最下部の「Deploy」を押す

`PRIVATE_KEY_ES256_B64` はOAuthログインに使う秘密鍵です。画面に書かれたopensslのコマンドを手元のターミナルで実行して作ります。

デプロイ後のドメインなどの設定は、Railwayのドキュメントを見てください。

## Docker Compose

4コア・4GBメモリ・100GBストレージ程度のVPSを想定しています。DockerとDocker Composeを入れ、ドメインのAレコードをVPSに向け、80番と443番のポートを開けておくと、HTTPS証明書は自動で取得されます。

1. リポジトリをcloneして移動する

```bash
git clone https://github.com/mkizka/subscope.git
cd subscope/deploy
```

2. 設定ファイルをコピーし、コメントにあるコマンドで値を作って入力する

```bash
cp .env.example .env
```

3. 起動する

```bash
docker compose up -d --build
```

`https://<DOMAIN>` でWebクライアントと管理画面が開き、同じドメインでAppView（`did:web:<DOMAIN>`）が公開されます。

更新するときは、`git pull` のあと `docker compose up -d --build` をもう一度実行します。
