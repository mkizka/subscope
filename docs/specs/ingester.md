# Ingester仕様

ingesterはモデレーションサービスから受け取ったラベルをジョブキューに積む。Tapのイベントはworkerが直接受け取る。

## ラベルの受信

`MODERATION_URL` のモデレーションサービスの `subscribeLabels` に接続し、受け取ったラベルをlabelキューに積む。デフォルトはBluesky公式の `wss://mod.bsky.app` で、セルフホストする場合は環境変数で上書きできる。

- label-1: 受け取ったラベルを1件ずつlabelキューに積む
- label-2: 最後に受け取ったラベルのseqをRedisに保存し、再接続時はその続きから受け取る

seqはモデレーションサービスのURLごとに保存するので、`MODERATION_URL` を変えた場合は新しいサービスの現在のラベルから受け取る。

## その他

- `DISABLE_INGESTER` が `true` のときはモデレーションサービスに接続しない
- `/health` で稼働状態を、`/metrics` でキューとラベル数のメトリクスを返す
