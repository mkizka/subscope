# Ingester仕様

ingesterは何も処理しない。Tapのイベントとモデレーションサービスのラベルはworkerが直接受け取る。

## その他

- `/health` で稼働状態を、`/metrics` でキューのメトリクスを返す
