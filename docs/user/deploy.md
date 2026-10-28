# デプロイ方法

以下の方法でSubscopeをデプロイし、セルフホスティングできます。

## Railway

PaaSプラットフォームである[Railway](https://railway.com/)にデプロイすることができます。ただし、アカウントがHobbyプラン以上である必要があります。

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/3u7GrK?referralCode=mveF9L)

1. 上記リンクを開いて「Deploy Now」をクリック
2. 各アプリケーションの「Configure」をクリックして必要な環境変数を入力

**PRIVATE_KEY_ES256_B64**

管理画面のOAuthログインに使用する秘密鍵を入力してください。画面に書かれている`openssl`から始まるコマンドをローカル端末のターミナルで実行して値を作成できます。

3. 環境変数が入力出来たら全ての「Save Config」をクリック
4. 最下部の「Deploy」をクリック

以上でデプロイ完了です。Railwayのドキュメントを確認して、使用するドメインを変更したり設定を行ってください。

## Docker Compose

4コア / 4GB RAM / 100GB ストレージ程度のVPSを想定しています。DockerとDocker Composeをインストールし、ドメインのAレコードをVPSに向けておいてください。80/443番ポートを開放しておけば、CaddyがHTTPS証明書を自動で取得します。

1. リポジトリをcloneして`deploy`ディレクトリに移動

```bash
git clone https://github.com/mkizka/subscope.git
cd subscope/deploy
```

2. `.env.example`を`.env`にコピーし、コメントのコマンドで値を作成して入力

```bash
cp .env.example .env
```

3. 起動

```bash
docker compose up -d --build
```

`https://<DOMAIN>`で管理画面とクライアントが、同じドメインでAppView(`did:web:<DOMAIN>`)が公開されます。

更新するときは`git pull`したあと、もう一度`docker compose up -d --build`を実行してください。
