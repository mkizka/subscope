# AppView仕様

AppViewが提供するXRPC API（Blueskyの標準APIと独自API）の振る舞いを定める。レスポンスは常にlexiconに適合する。

## app.bsky.actor.getProfile

指定したアクターの詳細なプロフィールを返す。認証は任意。

- getProfile-1: 指定したアクターのprofileViewDetailedを返す
- getProfile-2: 保存されていないアクターには400を返す
- getProfile-3: プロフィールレコードがないアクターには、DIDとハンドルだけのprofileViewDetailedを返す

## app.bsky.actor.getProfiles

指定した複数アクターの詳細なプロフィールを返す。認証は任意。

- getProfiles-1: DIDとハンドルのどちらでも指定でき、見つかったアクターだけを指定した順に返す

## app.bsky.actor.searchActors

表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActors-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewで返す

## app.bsky.actor.searchActorsTypeahead

入力補完用に、表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActorsTypeahead-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewBasicで返す

## app.bsky.actor.getPreferences

閲覧者の設定を返す。設定の保存には対応していないため、固定の設定を返す。

- getPreferences-1: Followingフィードをピン留めした設定を返す

## app.bsky.feed.getTimeline

閲覧者のホームタイムラインを返す。認証が必要。

- getTimeline-1: 認証がないリクエストには401を返す
- getTimeline-2: 閲覧者本人とフォロイーの投稿・リポストを含める
- getTimeline-3: フォロイー以外の投稿・リポストは含めない
- getTimeline-4: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す
- getTimeline-5: 投稿者にプロフィールレコードがなくても投稿を含め、authorはDIDとハンドルだけにする

## app.bsky.feed.getListFeed

指定したリストのメンバーの投稿とリポストを新しい順に返す。認証は任意。

- getListFeed-1: リストのメンバーの投稿だけをfeedViewPostで返す

## app.bsky.feed.getActorLikes

指定したアクターがいいねした投稿を新しい順に返す。認証は任意。

- getActorLikes-1: 指定したアクターがいいねした投稿をfeedViewPostで返す

## app.bsky.feed.getLikes

指定した投稿へのいいねを新しい順に返す。認証は任意。

- getLikes-1: 指定した投稿にいいねしたアクターをprofileViewで返す

## app.bsky.feed.getRepostedBy

指定した投稿をリポストしたアクターを新しい順に返す。認証は任意。

- getRepostedBy-1: 指定した投稿をリポストしたアクターをprofileViewで返す

## app.bsky.feed.getFeedGenerators

指定したフィードジェネレーターの情報を返す。認証は任意。

- getFeedGenerators-1: 指定したフィードジェネレーターをgeneratorViewで返す

## app.bsky.feed.searchPosts

本文が検索クエリに一致する投稿を新しい順に返す。認証は任意。

- searchPosts-1: 本文がクエリに一致する投稿をpostViewで返す

## app.bsky.feed.getPosts

指定したURIの投稿をpostViewとして返す。認証は任意。

- getPosts-1: 指定したURIの順に投稿を並べる
- getPosts-2: 存在しない投稿は含めない

## app.bsky.feed.getPostThread

指定した投稿を中心に、親投稿とリプライを含むスレッドを返す。認証は任意。

- getPostThread-1: 指定した投稿の親投稿とリプライをthreadViewPostに含める
- getPostThread-2: 存在しない投稿には400とNotFoundを返す

## app.bsky.feed.getAuthorFeed

指定したアクターの投稿とリポストを新しい順に返す。認証は任意。

- getAuthorFeed-1: 指定したアクターの投稿をfeedViewPostで返す
- getAuthorFeed-2: 解決できないハンドルには400を返す

## app.bsky.notification.listNotifications

閲覧者宛ての通知を返す。認証が必要。priorityは無視し、常に全件を返す。

- listNotifications-1: 認証がないリクエストには401を返す
- listNotifications-2: 閲覧者宛ての通知を新しい順に返す
- listNotifications-3: 既読時刻以前の通知は既読にし、それより後の通知は未読にする
- listNotifications-4: reasonsを指定すると、その種類の通知だけを返す
- listNotifications-5: seenAtに閲覧者の既読時刻を返す

## app.bsky.notification.getUnreadCount

閲覧者宛ての未読通知の数を返す。認証が必要。priorityは無視する。

- getUnreadCount-1: 認証がないリクエストには401を返す
- getUnreadCount-2: 既読時刻より新しい通知の数を返す
- getUnreadCount-3: seenAtを指定すると、保存した既読時刻の代わりにseenAtより新しい通知の数を返す

## app.bsky.notification.updateSeen

閲覧者の既読時刻を更新する。認証が必要。

- updateSeen-1: 認証がないリクエストには401を返す
- updateSeen-2: 指定した時刻以前の通知を既読にする

## app.bsky.graph.getFollowers

指定したアクターをフォローしているアクターを返す。認証は任意。

- getFollowers-1: 指定したアクターをsubjectに、そのフォロワーをfollowersにprofileViewで返す

## app.bsky.graph.getFollows

指定したアクターがフォローしているアクターを返す。認証は任意。

- getFollows-1: 指定したアクターをsubjectに、そのフォロー先をfollowsにprofileViewで返す

## app.bsky.graph.getList

指定したリストとそのリストに追加されたアクターを返す。認証は任意。

- getList-1: 指定したリストのlistViewと、リストに追加されたアクターのprofileViewをitemsで返す
- getList-2: 保存されていないリストには400を返す

## app.bsky.graph.getLists

指定したアクターが作成したリストを返す。認証は任意。

- getLists-1: 指定したアクターが作成したリストをlistViewで返す
- getLists-2: purposesを指定すると、その用途のリストだけを返す

## me.subsco.server.getSetupStatus

サーバーの初期設定が済んでいるかを返す。認証は不要。管理者が登録済みなら initialized を true にする。

## me.subsco.sync.subscribeServer

閲覧者をサブスクライバーとして登録し、Tapに閲覧者のリポジトリを追加する。認証が必要。管理者は招待コードなしで登録でき、それ以外は有効期限内の未使用の招待コードが必要で、使った招待コードは使用済みになる。招待コードが無効なら400とInvalidInviteCodeを、登録済みなら400とAlreadySubscribedを返す。

- subscribeServer-1: 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す
- subscribeServer-2: BANされたアカウントは登録せず、400とBannedを返す

## me.subsco.sync.unsubscribeServer

閲覧者のサブスクライバー登録を解除する。認証が必要。使った招待コードは使用済みのまま残る。登録していなければ400とNotSubscribedを返す。

- unsubscribeServer-1: 本人とそのフォロイーのsyncTapRepoジョブを積む

## me.subsco.sync.getSubscriptionStatus

閲覧者がサブスクライバーかどうかを返す。認証が必要。

## me.subsco.admin.verifyAccess

閲覧者の管理画面へのアクセス権を返す。認証が必要。statusは管理者が未登録なら `needsSetup`、閲覧者が管理者なら `authorized`、それ以外は `unauthorized` になる。

## me.subsco.admin.registerAdmin

管理者が未登録のとき、閲覧者を管理者として登録し、サブスクライバーにもする。認証が必要。既に管理者がいる場合は400とAdminAlreadyExistsを返す。

## me.subsco.admin.getSubscribers

サブスクライバーのプロフィールと管理者かどうかを返す。limitとcursorでページングする。今は認証を確認していない。

## me.subsco.admin.banSubscriber

サブスクライバーの登録を解除し、BANする。管理者の認証が必要。登録していなければ400とNotSubscribedを返す。

- banSubscriber-1: 管理者はBANせず、400とCannotBanAdminを返す
- banSubscriber-2: 本人とそのフォロイーのsyncTapRepoジョブを積む

## me.subsco.admin.createInviteCode

daysToExpire日後に期限が切れる招待コードを作る。管理者の認証が必要。

## me.subsco.admin.getInviteCodes

招待コードを、使用日時と使用したアクターとともに返す。管理者の認証が必要。limitとcursorでページングする。

## me.subsco.admin.deleteInviteCode

未使用の招待コードを削除する。管理者の認証が必要。

- deleteInviteCode-1: 存在しない招待コードには400とInviteCodeNotFoundを返す
- deleteInviteCode-2: 使用済みの招待コードには400とInviteCodeAlreadyUsedを返す
