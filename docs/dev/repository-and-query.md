# リポジトリとクエリサービス

## リポジトリ

ドメインモデルを永続化するためのinterface(`I*Repository`)。メソッドは次の3つだけにする。

- `find` - キーでドメインモデルを1つ取り出す
- `save` - ドメインモデルを保存する
- `delete` - ドメインモデルを削除する

部分更新もメソッドを増やさず、`find` で取り出したドメインモデルを変更して `save` する。競合を防ぐ必要があるときは、`find` を `SELECT ... FOR UPDATE` にする(悲観ロック)か、`save` で古いデータを上書きしないようにして結果を返す(楽観ロック)。

workerにはドメインモデルがなく、repositoryはTapのレコードをパースしたDTO(`application/dto/` のプレーンな型。`Follow`、`Like` など)を保存する。application層は `@repo/db` のスキーマ型に依存しない。DBへの変換はinfrastructureが担い、型の互換性は `insert(...).values()` のコンパイル時検査に任せる。
(`AccountStatus` / `BackfillStatus` など、一部のapplicationはまだ `@repo/db` に依存しており、別PRで直す。)

## クエリサービス

存在確認・一覧・集計・検索など、ドメインモデルを更新するためではない読み取りは、クエリサービス(`I*Query`)に書く。

クエリサービスはドメインモデルを返さず、DTOを返す。ドメインモデルは更新するために取り出すものなので、読み取りで返すと役割が混ざる。

DTOは用途ごとに分け、呼び出し側が使う項目だけを持たせる。1つのDTOに項目を足していくと、使わない項目のために読み取りが重くなる。

## トランザクション

ユースケースはリポジトリやクエリサービスに渡す `ctx` を、読み取りだけや1回書くだけでも `transactionManager.transaction` で作る。`DatabaseClient` を受け取って `{ db }` を直接作らない。書き方を1つにしておけば、あとで書き込みが増えても包み直さずに済む。

外部への通信(DID解決やTapへの問い合わせなど)はトランザクションの外で行い、その前後の読み書きをそれぞれ別のトランザクションにする。

## lintルール

`I*Repository` に `find`・`save`・`delete` 以外のメソッドを書くと、ESLint(`no-restricted-syntax`)がエラーにする。

`domain`・`application` から `infrastructure`・`presentation`・`@repo/db` をimportすると、ESLint(`no-restricted-imports`)がエラーにする。webの `app/server/application` も同じルールの対象とする。既知の違反は `packages/eslint-config/index.js` に例外として列挙している。
