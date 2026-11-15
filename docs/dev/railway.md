# Railwayへのデプロイ(IaC)

本番環境はRailwayのプロジェクトとしてリポジトリ内のコードで定義する。シンガポールリージョンに、セルフホスト用のDocker Composeと同じAppview・Web・Worker・Tap・ATBlob・Postgres・Redisを置く。加えて、Appview・Worker・Tapのメトリクスを集めるPrometheusと、それを表示するGrafanaを置く。

Grafanaのデータソースとダッシュボードもリポジトリのファイルから作るので、ダッシュボードの変更はPRで行う。UIで変えたアカウント名などの設定はボリュームに残り、再デプロイで消えない。

## 反映の流れ

| タイミング              | 動き                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Railwayの定義を変えたPR | GitHub Actionsが `railway config plan` の結果をPRにコメントする                                                                |
| PRのマージ              | そのPRのplanを `railway config apply` で本番に適用する。planの後に環境が変わっていると失敗するので、PRを更新してplanをやり直す |

定義に書いていないリソースはapplyで削除される。

## 初回セットアップ

1. Railwayで空のプロジェクトを作り、production環境のプロジェクトトークンを作る
2. トークンをGitHubリポジトリのシークレット `RAILWAY_TOKEN` に登録する
3. Railwayの定義を変えるPRをマージしてapplyする(手元で `railway link` と `railway config apply` をしてもよい)
4. 下の表の変数をダッシュボードで設定する
5. 定義に書いたカスタムドメインのDNSレコードを、ダッシュボードの表示どおりに設定する

| サービス | 変数                                                     | 作り方・用途                                                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web      | `COOKIE_SECRET`                                          | `openssl rand -base64 33`                                                                                                                                                                                                                        |
| Web      | `PRIVATE_KEY_ES256_B64`                                  | `openssl ecparam -name prime256v1 -genkey \| openssl pkcs8 -topk8 -nocrypt \| openssl base64 -A`                                                                                                                                                 |
| Web      | `ADMIN_API_TOKEN`                                        | 外部からジョブキューを読み取り専用で読む場合だけ設定する                                                                                                                                                                                         |
| Grafana  | `GF_SECURITY_ADMIN_PASSWORD`                             | 未設定だとGrafanaは起動しない                                                                                                                                                                                                                    |
| Worker   | `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT` | プッシュ通知を使う場合だけ設定する。鍵は `npx web-push generate-vapid-keys` で作り、`VAPID_SUBJECT` は `mailto:` かhttpsのURLにする。Webの `VAPID_PUBLIC_KEY` はWorkerの値を参照する。未設定でも起動し、プッシュ通知の切り替えが出ないだけになる |
