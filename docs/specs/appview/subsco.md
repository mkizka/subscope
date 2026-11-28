# AppView仕様: me.subsco

## me.subsco.graph.getServerMemberFollowers

指定したアカウントをフォローしているメンバーと、その総数を返す。認証は不要。

| ID                         | 仕様                                                        |
| -------------------------- | ----------------------------------------------------------- |
| getServerMemberFollowers-1 | 指定したアカウントをフォローしているメンバーだけを返す      |
| getServerMemberFollowers-2 | 新しくフォローした順に並べ、ページ送りする                  |
| getServerMemberFollowers-3 | totalにはページに関係なくメンバーのフォロワーの総数を入れる |

## me.subsco.server.getServerMembers

メンバーの一覧を返す。メンバーの一覧は公開情報なので、認証は不要。

| ID                 | 仕様                                                       |
| ------------------ | ---------------------------------------------------------- |
| getServerMembers-1 | メンバーごとにプロフィールを返す                           |
| getServerMembers-2 | メンバーごとに管理者かどうかを返す                         |
| getServerMembers-3 | qを指定すると、表示名かハンドルにqを含むメンバーだけを返す |

qは大文字と小文字を区別しない。

## me.subsco.server.getLocalTimeline

メンバーの投稿とリポストを並べたローカルタイムラインを返す。認証は任意で、認証すると閲覧者から見た状態も返す。

| ID                 | 仕様                                               |
| ------------------ | -------------------------------------------------- |
| getLocalTimeline-1 | メンバーの投稿とリポストを、新しいものほど上に返す |
| getLocalTimeline-2 | メンバー以外のアカウントの投稿は含めない           |
| getLocalTimeline-3 | メンバーのリプライは含めない                       |

## me.subsco.server.getSetupStatus

サーバーの初期設定が済んでいるかを返す。認証は不要。

| ID               | 仕様                                        |
| ---------------- | ------------------------------------------- |
| getSetupStatus-1 | 管理者が未登録ならinitializedをfalseにする  |
| getSetupStatus-2 | 管理者が登録済みならinitializedをtrueにする |

## me.subsco.server.getOperator

サーバーの運営者を返す。運営者は、管理者のうち最初にサーバーに登録した1人。認証は不要。

| ID            | 仕様                                        |
| ------------- | ------------------------------------------- |
| getOperator-1 | 管理者のうち最初に登録したメンバー1人を返す |
| getOperator-2 | 管理者がいなければoperatorを含めない        |

## me.subsco.server.getFollowedAccounts

メンバーの1人以上にフォローされているアカウント（メンバーも含む）を、フォローしているメンバーの数と総数とともに返す。認証が必要。

| ID                    | 仕様                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| getFollowedAccounts-1 | メンバーの1人以上にフォローされているアカウントだけを返す                                        |
| getFollowedAccounts-2 | フォローしているメンバーが多い順に並べる                                                         |
| getFollowedAccounts-3 | totalにはページに関係なくフォローされているアカウントの総数を入れる                              |
| getFollowedAccounts-4 | qを指定すると、表示名かハンドルにqを含むアカウントだけを返す。totalはqに関係なく総数のままにする |

qは大文字と小文字を区別しない。

## me.subsco.sync.registerAccount

閲覧者をメンバーに登録し、Tapに追加する。認証が必要。

| ID                | 仕様                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| registerAccount-1 | 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す  |
| registerAccount-3 | 管理者以外は、有効な招待コードがなければ登録せず、400とInvalidInviteCodeを返す |
| registerAccount-4 | 登録済みのアカウントは登録せず、400とAlreadyRegisteredを返す                   |
| registerAccount-5 | 管理者は招待コードなしで登録する                                               |
| registerAccount-6 | 登録に使った招待コードを使用済みにする                                         |
| registerAccount-7 | 登録したアカウントをTapに追加する                                              |
| registerAccount-8 | まだ保存していないアカウントも登録する                                         |
| registerAccount-9 | 登録したアカウントの保存済みのフォロー先を、追跡アカウントにする               |

特定のアカウントの登録を拒む仕組み（登録制限）は持たない。招待コードは管理者だけが発行するので、今は必要がない。必要になってから入れる。

有効な招待コードは、有効期限内で未使用のもの。

## me.subsco.sync.unregisterAccount

閲覧者のメンバー登録を解除する。認証が必要。

| ID                  | 仕様                                                              |
| ------------------- | ----------------------------------------------------------------- |
| unregisterAccount-1 | 本人をTapから外し、本人とそのフォロー先が追跡アカウントかを見直す |
| unregisterAccount-2 | 登録を消し、使った招待コードは使用済みのまま残す                  |
| unregisterAccount-3 | メンバーでなければ400とNotMemberを返す                            |

## me.subsco.sync.getBackfillStatuses

指定したアカウントのうち、メンバーについて、バックフィルの状態を返す。認証は不要。一度に指定できるのは100件まで。

| ID                    | 仕様                                                 |
| --------------------- | ---------------------------------------------------- |
| getBackfillStatuses-1 | メンバーだけを返す                                   |
| getBackfillStatuses-2 | 状態をまだ確認していないアカウントは同期中として返す |
| getBackfillStatuses-3 | 認証がなくても状態を返す                             |

メンバー以外のアカウントは保存する範囲が狭い。状態が返らなかったアカウントはメンバーでないので、画面で表示が不十分だと示すのにも使う。

## me.subsco.sync.getRegistrationStatus

閲覧者がメンバーかどうかを返す。認証が必要。

| ID                      | 仕様                                            |
| ----------------------- | ----------------------------------------------- |
| getRegistrationStatus-1 | 閲覧者がメンバーならisMemberをtrueにする        |
| getRegistrationStatus-2 | 閲覧者がメンバーでなければisMemberをfalseにする |

## me.subsco.admin.verifyAccess

閲覧者が管理画面を使えるかを返す。認証が必要。

| ID             | 仕様                                       |
| -------------- | ------------------------------------------ |
| verifyAccess-1 | 管理者ならstatusをauthorizedにする         |
| verifyAccess-2 | 管理者でなければstatusをunauthorizedにする |

## me.subsco.admin.registerAdmin

管理者がまだいないとき、閲覧者を最初の管理者として登録する。認証が必要。

| ID              | 仕様                                                         |
| --------------- | ------------------------------------------------------------ |
| registerAdmin-1 | 閲覧者を管理者にし、メンバーにする                           |
| registerAdmin-2 | 既に管理者がいれば、400とAdminAlreadyExistsを返す            |
| registerAdmin-3 | 閲覧者とその保存済みのフォロー先をTapに追加するジョブを積む  |
| registerAdmin-4 | 閲覧者のプロフィールを取得するジョブを積む                   |
| registerAdmin-5 | 閲覧者のハンドルが未取得なら、ハンドルを解決するジョブを積む |

## me.subsco.admin.listServerMembers

メンバーの一覧と総数を返す。管理者の認証が必要。limitとcursorでページングする。

| ID                  | 仕様                                                             |
| ------------------- | ---------------------------------------------------------------- |
| listServerMembers-1 | 認証がなければ401を返す                                          |
| listServerMembers-2 | 管理者でなければ403を返す                                        |
| listServerMembers-3 | メンバーごとにprofileViewと管理者かどうかを返す                  |
| listServerMembers-4 | テイクダウンされたメンバーも含める                               |
| listServerMembers-5 | メンバーごとに登録日時を返す                                     |
| listServerMembers-6 | totalにはページングに関係なくメンバーの総数を入れる              |
| listServerMembers-7 | メンバー本人のバックフィルの状態を返し、フォロー先の状態は見ない |
| listServerMembers-8 | バックフィルの状態をまだ確認していなければinProgressにする       |

バックフィルの状態は、workerがアカウントに保存したもの（[バックフィルの状態の確認](../worker/backfill.md#バックフィルの状態の確認)）を読む。

## me.subsco.admin.addMember

指定したアカウントを、本人のログインなしでメンバーに登録する。管理者の認証が必要。ハンドルかDIDを1件ずつ受け取る。

| ID          | 仕様                                                                |
| ----------- | ------------------------------------------------------------------- |
| addMember-1 | 指定したアカウントを招待コードなしでメンバーに登録し、Tapに追加する |
| addMember-2 | ハンドルを指定すると、DIDに解決して登録する                         |
| addMember-3 | アカウントが見つからなければ400とAccountNotFoundを返す              |
| addMember-4 | 登録済みのアカウントは登録せず、400とAlreadyRegisteredを返す        |
| addMember-6 | 管理者でなければ403を返す                                           |

登録後の扱いは、本人がログインして登録したときと同じ。一度に大量に追加するとworkerのキューが詰まるため、一括追加は用意しない。

## me.subsco.admin.grantAdmin

メンバーを管理者にする。管理者の認証が必要。

| ID           | 仕様                                   |
| ------------ | -------------------------------------- |
| grantAdmin-1 | 指定したメンバーを管理者にする         |
| grantAdmin-2 | メンバーでなければ400とNotMemberを返す |

## me.subsco.admin.revokeAdmin

管理者を外す。管理者の認証が必要。

| ID            | 仕様                                    |
| ------------- | --------------------------------------- |
| revokeAdmin-1 | 指定した管理者を管理者から外す          |
| revokeAdmin-2 | 自分自身なら400とCannotRevokeSelfを返す |
| revokeAdmin-3 | メンバーでなければ400とNotMemberを返す  |

## me.subsco.admin.removeMember

メンバーから外す。管理者の認証が必要。メンバーでなければ400とNotMemberを返す。外したアカウントも、招待コードがあれば再登録できる。

| ID             | 仕様                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| removeMember-1 | 管理者は登録を消さず、400とCannotRemoveAdminを返す                      |
| removeMember-2 | 本人とそのフォロー先について、Tapに追加するか外すかを決めるジョブを積む |
| removeMember-3 | 登録を消す                                                              |

## me.subsco.admin.createInviteCode

招待コードを作る。管理者の認証が必要。

| ID                 | 仕様                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| createInviteCode-1 | コードは公開URLのホスト名の「.」を「-」に変え、「-」とランダムな英小文字・数字5文字を続けたものにする |
| createInviteCode-2 | 有効期限はdaysToExpire日後にする                                                                      |

ランダムな5文字は、推測されないよう暗号論的乱数で作る。

## me.subsco.admin.getInviteCodes

招待コードを、使った日時とアカウントとともに返す。管理者の認証が必要。limitとcursorでページングする。

| ID               | 仕様                                                            |
| ---------------- | --------------------------------------------------------------- |
| getInviteCodes-1 | 使用済みの招待コードには、使ったアカウントのprofileViewを含める |
| getInviteCodes-2 | 使ったアカウントがテイクダウンされていてもprofileViewを含める   |

## me.subsco.admin.deleteInviteCode

未使用の招待コードを消す。管理者の認証が必要。

| ID                 | 仕様                                                     |
| ------------------ | -------------------------------------------------------- |
| deleteInviteCode-1 | 存在しない招待コードなら400とInviteCodeNotFoundを返す    |
| deleteInviteCode-2 | 使用済みの招待コードなら400とInviteCodeAlreadyUsedを返す |
