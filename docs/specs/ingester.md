# Ingester仕様

ingesterはTapから受け取ったイベントをジョブキューに積む。インデックスはworkerが行う。

## Tapからのイベント受信

Tapの `/channel` にWebSocketで接続し、recordイベントをcommitキューに、identityイベントをidentityキューに積む。

- tap-1: サポートするコレクションのcreate・updateイベントは、レコードとCIDとrevを含めてcommitキューに積む
- tap-2: deleteイベントは、revを含め、レコードとCIDを含めずにcommitキューに積む
- tap-3: サポートしないコレクションのイベントは積まない
- tap-4: バックフィル(liveがfalse)のイベントは、ライブのイベントより低い優先度で積む
- tap-5: identityイベントはidentityキューに積む
- tap-6: キューに積めなかったイベントはTapにackしない

ackしなかったイベントはTapが再送する。

## ラベルの受信

`MODERATION_URL` のモデレーションサービスの `subscribeLabels` に接続し、受け取ったラベルをlabelキューに積む。デフォルトはBluesky公式の `wss://mod.bsky.app` で、セルフホストする場合は環境変数で上書きできる。

- label-1: 受け取ったラベルを1件ずつlabelキューに積む

## その他

- `DISABLE_INGESTER` が `true` のときはTapとモデレーションサービスに接続しない
- `/health` で稼働状態を、`/metrics` でキューとイベント数のメトリクスを返す
