# Ingester仕様

ingesterはTapから受け取ったイベントをジョブキューに積む。インデックスはworkerが行う。

## Tapからのイベント受信

Tapの `/channel` にWebSocketで接続し、recordイベントをcommitキューに、identityイベントをidentityキューに積む。

- tap-1: サポートするコレクションのcreate・updateイベントは、レコードとCIDを含めてcommitキューに積む
- tap-2: deleteイベントは、レコードとCIDを含めずにcommitキューに積む
- tap-3: サポートしないコレクションのイベントは積まない
- tap-4: バックフィル(liveがfalse)のイベントは、ライブのイベントより低い優先度で積む
- tap-5: identityイベントはidentityキューに積む
- tap-6: キューに積めなかったイベントはTapにackしない

ackしなかったイベントはTapが再送する。

## その他

- `DISABLE_INGESTER` が `true` のときはTapとモデレーションサービスに接続しない
- モデレーションサービスのラベルを購読し、受信数をメトリクスに記録する(保存はしない)
- `/health` で稼働状態を、`/metrics` でキューとイベント数のメトリクスを返す
