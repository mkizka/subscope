# Ingester仕様

ingesterはTapから受け取ったイベントをジョブキューに積む。インデックスはworkerが行う。

## Tapからのイベント受信

Tapの `/channel` にWebSocketで接続し、recordイベントをcommitキューに、identityイベントをidentityキューに積む。

- tap-1: サポートするコレクションのcreate・updateイベントは、レコードとCIDとrevを含めてcommitキューに積む
- tap-2: deleteイベントは、revを含め、レコードとCIDを含めずにcommitキューに積む
- tap-3: サポートしないコレクションのイベントは積まない
- tap-4: バックフィル(liveがfalse)のイベントは、ライブのイベントより低い優先度で積む
- tap-5: identityイベントは、ハンドルとアカウントの状態を含めてidentityキューに積む
- tap-6: キューに積めなかったイベントはTapにackしない
- tap-7: 同じレコードの同じrevのイベントは、同じjobIdで積んでキューでの重複を防ぐ

ackしなかったイベントや、ackが時間内に届かなかったイベントはTapが再送する。初回同期のように処理が追いつかないときは再送が多発するため、jobIdで重複を防ぐ。

## ラベルの受信

`MODERATION_URL` のモデレーションサービスの `subscribeLabels` に接続し、受け取ったラベルをlabelキューに積む。デフォルトはBluesky公式の `wss://mod.bsky.app` で、セルフホストする場合は環境変数で上書きできる。

- label-1: 受け取ったラベルを1件ずつlabelキューに積む
- label-2: 最後に受け取ったラベルのseqをRedisに保存し、再接続時はその続きから受け取る

seqはモデレーションサービスのURLごとに保存するので、`MODERATION_URL` を変えた場合は新しいサービスの現在のラベルから受け取る。

## その他

- `DISABLE_INGESTER` が `true` のときはTapとモデレーションサービスに接続しない
- `/health` で稼働状態を、`/metrics` でキューとイベント数のメトリクスを返す
