# Worker仕様: アカウント

## アカウント状態の保存

Tapのidentityイベントが持つアカウントの状態(active、deactivated、deleted、suspended、takendown)を保存する。

| ID        | 仕様                                                |
| --------- | --------------------------------------------------- |
| account-1 | アカウントの状態を保存する                          |
| account-2 | 状態が deleted のアカウントは、アカウントを削除する |

deleted は取り消せないので、レコードや登録も一緒に削除する。それ以外の状態は元に戻りうるので、データを残してappviewで隠す。

## ハンドルの解決

ハンドルを持たないか handle.invalid のアカウントについて、DIDドキュメントからハンドルを解決して保存する。

| ID           | 仕様                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| resolveDid-1 | DIDドキュメントのハンドルは、同じDIDに解決できるときだけ保存する                         |
| resolveDid-2 | ハンドルが同じDIDに解決できないときは handle.invalid を保存する                          |
| resolveDid-3 | handle.invalid 以外のハンドルを持つアカウントは上書きしない                              |
| resolveDid-4 | Tapのidentityイベントのハンドルが handle.invalid のときは、DIDドキュメントから解決し直す |
| resolveDid-5 | DIDが登録されていないときは、再試行せずに終える                                          |

DIDドキュメントのハンドルは本人以外も書けるため、公式AppViewと同じく、ハンドルからDIDへ解決できるか確かめてから保存する。Tapも同じ検証をするので、すでにあるハンドルはTapを優先する。ただしTapは一時的な失敗でも handle.invalid を送るため、handle.invalid だけは自分で解決し直す。DIDが登録されていないときは再試行しても変わらないので失敗にせず、それ以外の失敗は再試行する。

`ATPROTO_HANDLE_RESOLVER_URL`を設定すると、ハンドルをDNSやHTTPSではなく、そのサーバーの com.atproto.identity.resolveHandle で解決する。.test のハンドルを使う開発環境向けの設定である。
