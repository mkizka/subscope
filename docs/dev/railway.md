# Railwayへのデプロイ(IaC)

本番環境のRailwayプロジェクトは `.railway/railway.ts` で定義する。構成は `deploy/compose.yaml` と同じで、シンガポールリージョンにAppview・Web・Worker・Tap・ATBlob・Postgres・Redisを置く。加えて、Appview・Worker・Tapの `/metrics` を集めるPrometheus(`.railway/prometheus/`)と、それを表示するGrafana(`.railway/grafana/`)を置く。Grafanaのデータソースとダッシュボードは `.railway/grafana/` 以下のファイルからプロビジョニングするので、ダッシュボードの変更はJSONを編集してPRにする。UIで変更したアカウント名などの設定はSQLiteに保存され、ボリューム(`grafana-data`)で再デプロイをまたいで残る。

## 反映の流れ

- `.railway/**` を変更したPRでは、GitHub Actions(`railway-config.yml`、[railwayapp/config](https://github.com/railwayapp/config))が `railway config plan` の結果をPRにコメントする
- PRをマージすると、そのPRで固定されたplanが `railway config apply` で本番に適用される。planの後に環境が変わっていた場合はapplyが失敗するので、PRを更新してplanをやり直す
- `railway.ts` に書いていないリソースはapplyで削除される

## 初回セットアップ

1. Railwayで空のプロジェクトを作り、production環境のプロジェクトトークンを作成する
2. トークンをGitHubリポジトリのシークレット `RAILWAY_TOKEN` に登録する
3. `.railway/**` を変更するPRをマージしてapplyする(手元で `railway link` して `railway config apply` してもよい)
4. Webの `COOKIE_SECRET` と `PRIVATE_KEY_ES256_B64` をダッシュボードで設定する(値の作り方は `apps/web/app/server/env.ts` のコメントを参照)
5. 運用の調査でClaudeなどにジョブキューを読ませる場合は、Webの `ADMIN_API_TOKEN` をダッシュボードで設定する
6. Grafanaの `GF_SECURITY_ADMIN_PASSWORD` をダッシュボードで設定する(未設定だとGrafanaは起動しない)
7. `railway.ts` の `domains` に書いたカスタムドメインのDNSレコードを、ダッシュボードの表示どおりに設定する
8. 運用の調査でClaudeなどにメトリクスを読ませる場合は、GrafanaでViewerロールのサービスアカウントのトークンを作る

## 運用の調査

Claude Codeのクラウド環境からは、ネットワークシークレットに登録したトークンをプロキシが付けるので、次のURLをcurlでGETすれば読める。

- ジョブキュー: `https://alpha.subsco.me/admin/bull-board/api/queues`(Webの `ADMIN_API_TOKEN`)
- メトリクス: `https://grafana.subsco.me/api/datasources/proxy/uid/prometheus/api/v1/query?query={PromQL}`(GrafanaのViewerトークン)。Tapの `tap_events_delivered_total`・`tap_events_acked_total`・`tap_resyncs_failed_total`、Workerの `worker_events_commit_total`・`worker_events_identity_total` などを読める。推移は `query_range` で読む
