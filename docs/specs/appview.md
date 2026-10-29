# AppView仕様

## me.subsco.sync.subscribeServer

招待コードを使って閲覧者をサブスクライバーとして登録する。認証が必要。

- subscribeServer-1: 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す
