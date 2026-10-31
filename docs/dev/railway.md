# Railwayへのデプロイ(IaC)

本番環境のRailwayプロジェクトは `.railway/railway.ts` で定義する。構成は `deploy/compose.yaml` と同じで、シンガポールリージョンにAppview・Web・Worker・Ingester・Tap・ATBlob・Postgres・Redisを置く。加えて、IngesterとWorkerの `/metrics` を集めるPrometheus(`prometheus/`)と、それを表示するGrafana(`grafana/`)を置く。Grafanaのデータソースとダッシュボードは `grafana/` 以下のファイルからプロビジョニングするので、ダッシュボードの変更はJSONを編集してPRにする。

## 反映の流れ

- `.railway/**` を変更したPRでは、GitHub Actions(`railway-config.yml`)が `railway config plan` の結果をPRにコメントする
- PRをマージすると、そのplanが `railway config apply` で本番に適用される
- `railway.ts` に書いていないリソースはapplyで削除される

## 初回セットアップ

1. Railwayで空のプロジェクトを作り、production環境のプロジェクトトークンを作成する
2. トークンをGitHubリポジトリのシークレット `RAILWAY_TOKEN` に登録する
3. `.railway/**` を変更するPRをマージしてapplyする(手元で `railway link` して `railway config apply` してもよい)
4. Webの `COOKIE_SECRET` と `PRIVATE_KEY_ES256_B64` をダッシュボードで設定する(値の作り方は `apps/web/app/server/env.ts` のコメントを参照)
5. Grafanaの `GF_SECURITY_ADMIN_PASSWORD` をダッシュボードで設定する(未設定だと初期パスワードの `admin` になる)
6. `railway.ts` の `domains` に書いたカスタムドメインのDNSレコードを、ダッシュボードの表示どおりに設定する
