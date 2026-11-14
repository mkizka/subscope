# AppView仕様: me.subsco

## me.subsco.graph.getServerMemberFollowers

指定したアカウントをフォローしているメンバーをprofileViewで返す。認証は不要。limitとcursorでページングする。

- getServerMemberFollowers-1: 指定したアカウントをフォローしているメンバーだけをfollowersにprofileViewで返す
- getServerMemberFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す
- getServerMemberFollowers-3: totalにはページングに関係なくメンバーのフォロワーの総数を入れる

## me.subsco.server.getServerMembers

メンバーのプロフィールを返す。メンバーの一覧は公開情報とし、認証は不要。limitとcursorでページングする。qを指定すると、表示名またはハンドルにqを含む（大文字小文字を区別しない）アカウントだけを返す。

- getServerMembers-1: メンバーごとにprofileViewを返す
- getServerMembers-2: メンバーごとに管理者かどうかを返す
- getServerMembers-3: qを指定すると、表示名またはハンドルにqを含むメンバーだけを返す

## me.subsco.server.getLocalTimeline

メンバーの投稿とリポストを、新しいものほど上にfeedViewPostで返す。ローカルタイムラインとして、メンバーのフォロー先ではないアカウントの投稿は含めない。認証は任意で、認証した場合は閲覧者のviewerを含める。limitとcursorでページングする。

- getLocalTimeline-1: メンバーの投稿とリポストを、新しいものほど上に返す
- getLocalTimeline-2: メンバー以外のアカウントの投稿は含めない
- getLocalTimeline-3: メンバーのリプライは含めない

## me.subsco.server.getSetupStatus

サーバーの初期設定が済んでいるかを返す。認証は不要。

- getSetupStatus-1: 管理者が未登録ならinitializedをfalseにする
- getSetupStatus-2: 管理者が登録済みならinitializedをtrueにする

## me.subsco.server.getOperator

サーバーの運営者のprofileViewを返す。運営者は管理者のうち最初にサーバーに登録した1人。認証は不要。

- getOperator-1: 管理者のうち最初に登録したメンバー1人だけをoperatorにprofileViewで返す
- getOperator-2: 管理者がいなければoperatorを含めない

## me.subsco.server.getFollowedAccounts

フォローされているアカウント（メンバーの1人以上にフォローされているアカウント。メンバーも含む）のprofileViewと、そのアカウントをフォローしているメンバーの数、フォローされているアカウントの総数を返す。認証が必要。limitとcursorでページングする。qを指定すると、表示名またはハンドルにqを含む（大文字小文字を区別しない）フォローされているアカウントだけを返す。

- getFollowedAccounts-1: メンバーの1人以上にフォローされているアカウントを返し、それ以外のアカウントは含めない
- getFollowedAccounts-2: フォローしているメンバーが多い順に並べる
- getFollowedAccounts-3: totalにはページングに関係なくフォローされているアカウントの総数を入れる
- getFollowedAccounts-4: qを指定すると、表示名またはハンドルにqを含むフォローされているアカウントだけを返す。totalはqに関係なく総数のままにする

## me.subsco.sync.registerAccount

閲覧者を登録し、Tapに閲覧者のリポジトリを追加する。認証が必要。

- registerAccount-1: 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す
- registerAccount-2: サーバー登録を停止されたアカウントは登録せず、400とBannedを返す
- registerAccount-3: 管理者以外は、有効期限内の未使用の招待コードがなければ登録せず、400とInvalidInviteCodeを返す
- registerAccount-4: 登録済みのアカウントは登録せず、400とAlreadyRegisteredを返す
- registerAccount-5: 管理者は招待コードなしで登録する
- registerAccount-6: 登録に使った招待コードを使用済みにする
- registerAccount-7: 登録したアカウントのsyncTapRepoジョブを積む
- registerAccount-8: DBにないアカウントも登録する

## me.subsco.sync.unregisterAccount

閲覧者の登録を解除する。認証が必要。

- unregisterAccount-1: 本人とそのフォロー先のsyncTapRepoジョブを積む
- unregisterAccount-2: 登録を消し、使った招待コードは使用済みのまま残す
- unregisterAccount-3: 登録していなければ400とNotRegisteredを返す

## me.subsco.sync.getBackfillStatuses

指定したdidのうち、追跡アカウント（メンバーとそのフォロー先）のbackfillStatusを返す。認証は不要。didsは最大100件まで指定できる。

- getBackfillStatuses-1: 追跡アカウントのbackfillStatusを返し、追跡アカウント以外は含めない
- getBackfillStatuses-2: backfillStatusが未設定のアカウントはinProgressとして返す
- getBackfillStatuses-3: 認証がなくてもbackfillStatusを返す

## me.subsco.sync.getRegistrationStatus

閲覧者がメンバーかどうかを返す。認証が必要。

- getRegistrationStatus-1: 閲覧者がメンバーならisRegisteredをtrueにする
- getRegistrationStatus-2: 閲覧者がメンバーでなければisRegisteredをfalseにする

## me.subsco.admin.verifyAccess

閲覧者の管理画面へのアクセス権を返す。認証が必要。

- verifyAccess-1: 閲覧者が管理者ならstatusをauthorizedにする
- verifyAccess-2: 閲覧者が管理者でなければstatusをunauthorizedにする

## me.subsco.admin.registerAdmin

管理者が未登録のとき、閲覧者を最初の管理者として登録する。認証が必要。

- registerAdmin-1: 閲覧者を管理者にし、メンバーにする
- registerAdmin-2: 既に管理者がいれば、400とAdminAlreadyExistsを返す
- registerAdmin-3: 閲覧者のsyncTapRepoジョブを積む
- registerAdmin-4: 閲覧者のプロフィールのfetchRecordジョブを積む
- registerAdmin-5: 閲覧者のハンドルが未取得ならresolveDidジョブを積む

## me.subsco.admin.listServerMembers

メンバーのプロフィール、管理者かどうか、登録日時、同期状態と、メンバーの総数を返す。管理者の認証が必要。limitとcursorでページングする。

- listServerMembers-1: 認証がないリクエストには401を返す
- listServerMembers-2: 管理者でないアカウントからのリクエストには403を返す
- listServerMembers-3: メンバーごとにprofileViewと管理者かどうかを返す
- listServerMembers-4: テイクダウンされたメンバーも含める
- listServerMembers-5: メンバーごとに登録日時をregisteredAtとして返す
- listServerMembers-6: ページングに関係なくメンバーの総数をtotalとして返す
- listServerMembers-7: フォロー先の状態にかかわらず、メンバー本人のバックフィルの状態をbackfillStatusとして返す
- listServerMembers-8: メンバー本人のバックフィルの状態をまだ確認していなければ、backfillStatusをinProgressにする

バックフィルの状態はworkerがaccountsに保存したもの（[backfill-1](../worker.md#バックフィルの状態の確認)）を読む。

## me.subsco.admin.grantAdmin

指定したメンバーを管理者にする。管理者の認証が必要。

- grantAdmin-1: 指定したメンバーを管理者にする
- grantAdmin-2: メンバーでないアカウントには400とNotRegisteredを返す

## me.subsco.admin.revokeAdmin

指定した管理者の管理者権限を外す。管理者の認証が必要。

- revokeAdmin-1: 指定した管理者の管理者権限を外す
- revokeAdmin-2: 自分自身には400とCannotRevokeSelfを返す
- revokeAdmin-3: メンバーでないアカウントには400とNotRegisteredを返す

## me.subsco.admin.banAccount

メンバーの登録を解除し、サーバー登録を停止する。管理者の認証が必要。登録していなければ400とNotRegisteredを返す。

- banAccount-1: 管理者は登録停止せず、400とCannotBanAdminを返す
- banAccount-2: 本人とそのフォロー先のsyncTapRepoジョブを積む

## me.subsco.admin.getBannedAccounts

サーバー登録を停止中のアカウントのプロフィールを返す。管理者の認証が必要。limitとcursorでページングする。

- getBannedAccounts-1: 停止中のアカウントのprofileViewを返す
- getBannedAccounts-2: 停止中でないアカウントは含めない

## me.subsco.admin.unbanAccount

アカウントのサーバー登録の停止を取り消す(登録を再開する)。管理者の認証が必要。メンバーには戻さず、本人が改めて登録する。

- unbanAccount-1: 登録を再開したアカウントは招待コードで再登録できる
- unbanAccount-2: 停止中でないアカウントには400とNotBannedを返す

## me.subsco.admin.createInviteCode

招待コードを作る。管理者の認証が必要。

- createInviteCode-1: コードは公開URLのホスト名の「.」を「-」に置き換え、「-」と英小文字・数字のランダムな5文字を続けたものにする
- createInviteCode-2: 有効期限はdaysToExpire日後にする

ランダムな5文字は推測されないよう暗号論的乱数で作る。

## me.subsco.admin.getInviteCodes

招待コードを、使用日時と使用したアカウントとともに返す。管理者の認証が必要。limitとcursorでページングする。

- getInviteCodes-1: 使用済みの招待コードには使用したアカウントのprofileViewを含める
- getInviteCodes-2: 使用したアカウントがテイクダウンされていてもprofileViewを含める

## me.subsco.admin.deleteInviteCode

未使用の招待コードを削除する。管理者の認証が必要。

- deleteInviteCode-1: 存在しない招待コードには400とInviteCodeNotFoundを返す
- deleteInviteCode-2: 使用済みの招待コードには400とInviteCodeAlreadyUsedを返す
