# AppView仕様

AppViewが提供するXRPC API（Blueskyの標準APIと独自API）の振る舞いを定める。レスポンスは常にlexiconに適合する。

## 未実装のAPI

v1で対応しないXRPCやパラメータには、空の応答で成功を装わずエラーを返す。空の応答だと、クライアントは「データが無い」と区別できないため。

- notImplemented-1: 実装していないXRPCには501とMethodNotImplementedを返す

## テイクダウン

モデレーションサービスがテイクダウンしたアカウントや投稿と、PDSで停止されたアカウントを、APIの応答から隠す。データは消さないので、ラベルが取り消されたりアカウントが再開されたりすれば元に戻る。

- takedown-1: `!takedown` か `!suspend` のラベルが付いたアカウントと投稿は応答に含めない
- takedown-2: テイクダウンされたアカウントの投稿は応答に含めない
- takedown-3: 期限が切れたラベルは無視する
- takedown-4: 状態が takendown、suspended、deactivated のアカウントとその投稿は応答に含めない

## ラベル

モデレーションサービスが付けたラベルと、作成者がレコードに付けたセルフラベルを、プロフィールと投稿のビューの labels に載せる。公式クライアントは labels を見て警告やぼかしを表示する。今はgetPostsとフィード(getTimeline、getAuthorFeed、getActorLikes、getListFeed)が対応する。

- labels-1: プロフィールのビューの labels に、そのアカウントのDIDに付いたラベルを含める
- labels-2: 投稿のビューの labels に、その投稿に付いたラベルを含める
- labels-3: プロフィールのビューの labels に、プロフィールレコードに付いたラベルを含める
- labels-4: プロフィールのビューの labels に、プロフィールレコードのセルフラベルを含める
- labels-5: 投稿のビューの labels に、投稿レコードのセルフラベルを含める
- labels-6: 引用された投稿のビューの labels に、その投稿に付いたラベルを含める

セルフラベルは、レコードの作成者をsrc、レコードのURIとCIDをuriとcid、レコードのcreatedAtをctsとしたラベルとして返す。

## ラベラーの指定

クライアントが `atproto-accept-labelers` ヘッダーで指定したラベラー（モデレーションサービス）のラベルだけを labels に載せる。公式クライアントは、ユーザーが登録したラベラーをこのヘッダーで送る。今はgetPostsだけが対応する。

- labelers-1: labels には、`atproto-accept-labelers` ヘッダーで指定されたラベラーが付けたラベルだけを含める
- labelers-2: `atproto-accept-labelers` ヘッダーがないか不正な場合は、すべてのラベラーのラベルを labels に含める
- labelers-3: `atproto-accept-labelers` ヘッダーで指定されたラベラーを、応答の `atproto-content-labelers` ヘッダーで返す
- labelers-4: テイクダウンは、`atproto-accept-labelers` ヘッダーで指定されていないラベラーのラベルでも適用する

ヘッダーの `redact` パラメーターは、応答の `atproto-content-labelers` ヘッダーにそのまま返すだけで、テイクダウンの適用には使わない。

## 返信制限

スレッドの起点の投稿者がthreadgateで決めた返信できる人を、postViewに反映する。今はgetPostsとフィード(getTimeline、getAuthorFeed、getActorLikes、getListFeed)が対応する。

- threadgate-1: スレッドの起点の投稿は、そのthreadgateをthreadgateに含める
- threadgate-2: 閲覧者がthreadgateで返信を許されていないスレッドの投稿は、viewer.replyDisabledをtrueにする
- threadgate-3: 起点の投稿者と、allowの規則(mentionRule・followingRule・followerRule)のどれかに合う閲覧者は、viewer.replyDisabledをfalseにする
- threadgate-4: allowが無いthreadgateは、閲覧者のviewer.replyDisabledをfalseにする
- threadgate-5: allowのlistRuleのリストに入っている閲覧者は、viewer.replyDisabledをfalseにする
- threadgate-6: allowのlistRuleで指定したリストのうちインデックスしたものを、threadgate.listsにlistViewBasicとして含める

リストに入っているかは、インデックスしたlistitemで判定する。

## 引用制限

投稿者がpostgateで決めた引用の禁止と切り離しを、postViewに反映する。今はgetPostsとフィード(getTimeline、getAuthorFeed、getActorLikes、getListFeed)が対応する。

- postgate-1: postgateのembeddingRulesにdisableRuleがある投稿は、投稿者以外の閲覧者のviewer.embeddingDisabledをtrueにする
- postgate-2: 引用された投稿のpostgateのdetachedEmbeddingUrisに引用した投稿が含まれる場合、引用をviewDetachedにする

## フィード

getTimeline、getAuthorFeed、getActorLikes、getListFeed は投稿をfeedViewPostで返す。

- feedViewPost-1: リプライには、スレッドの起点と親の投稿をreplyに含める
- feedViewPost-2: 起点や親の投稿が見つからない場合、replyのその投稿をnotFoundPostにする
- feedViewPost-3: リポストには、リポストしたアカウントとリポストの日時をreasonに含める

## app.bsky.actor.getProfile

指定したアクターの詳細なプロフィールを返す。認証は任意。

- getProfile-1: 指定したアクターのprofileViewDetailedを返す
- getProfile-2: 保存されていないアクターには400を返す
- getProfile-3: プロフィールレコードがないアクターには、DIDとハンドルだけのprofileViewDetailedを返す
- getProfile-4: テイクダウンされたアカウントと、状態が takendown か suspended のアカウントには400とAccountTakedownを返す
- getProfile-5: 状態が deactivated のアカウントには400とAccountDeactivatedを返す

## app.bsky.actor.getProfiles

指定した複数アクターの詳細なプロフィールを返す。認証は任意。

- getProfiles-1: DIDとハンドルのどちらでも指定でき、見つかったアクターだけを指定した順に返す

## app.bsky.actor.searchActors

表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActors-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewで返す
- searchActors-2: ハンドルが検索語に部分一致するアクターも返す
- searchActors-3: 空白だけの検索語には何も返さない
- searchActors-4: cursorを指定すると、前のページに含めなかったアクターを返す

## app.bsky.actor.searchActorsTypeahead

入力補完用に、表示名またはハンドルが検索語に部分一致するアクターを返す。認証は任意。

- searchActorsTypeahead-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアクターをprofileViewBasicで返す
- searchActorsTypeahead-2: ハンドルが検索語に部分一致するアクターも返す
- searchActorsTypeahead-3: 空白だけの検索語には何も返さない

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
- getLikes-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.feed.getRepostedBy

指定した投稿をリポストしたアクターを新しい順に返す。認証は任意。

- getRepostedBy-1: 指定した投稿をリポストしたアクターをprofileViewで返す
- getRepostedBy-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.feed.getFeedGenerators

指定したフィードジェネレーターの情報を返す。認証は任意。

- getFeedGenerators-1: 指定したフィードジェネレーターをgeneratorViewで返す

## app.bsky.feed.searchPosts

本文が検索クエリに一致する投稿を新しい順に返す。認証は任意。

- searchPosts-1: 本文がクエリに一致する投稿をpostViewで返す

## app.bsky.feed.searchPostsV2

searchPostsの後継で、公式クライアントの投稿検索はこれを使う。認証は任意。

- searchPostsV2-1: 本文がqueryに一致する投稿をpostViewで返す

query以外の絞り込みパラメータ(authors、sortなど)は今は無視する。

## app.bsky.feed.getPosts

指定したURIの投稿をpostViewとして返す。認証は任意。

- getPosts-1: 指定したURIの順に投稿を並べる
- getPosts-2: 存在しない投稿は含めない
- getPosts-3: 閲覧者がいいね・リポストした投稿は、そのURIをviewer.likeとviewer.repostに含める

## app.bsky.feed.getPostThread

指定した投稿を中心に、親投稿とリプライを含むスレッドを返す。認証は任意。

- getPostThread-1: 指定した投稿の親投稿とリプライをthreadViewPostに含める
- getPostThread-2: 存在しない投稿には400とNotFoundを返す

## app.bsky.unspecced.getPostThreadV2

アンカー投稿を中心に、親投稿とリプライを深さ付きの平坦なリストで返す。認証は任意。branchingFactorとsortは無視し、hasOtherRepliesは常にfalseを返す。

- getPostThreadV2-1: 親投稿を負のdepth、アンカー投稿をdepth 0、リプライを正のdepthとして、上から順にthreadに含める
- getPostThreadV2-2: aboveがfalseのとき、親投稿を含めない
- getPostThreadV2-3: 存在しない投稿は、depth 0のthreadItemNotFoundとして返す

## app.bsky.feed.getAuthorFeed

指定したアクターの投稿とリポストを新しい順に返す。認証は任意。

- getAuthorFeed-1: 指定したアクターの投稿をfeedViewPostで返す
- getAuthorFeed-2: 解決できないハンドルには400を返す
- getAuthorFeed-3: filterがposts_with_mediaのとき、画像を添付したアクター自身の投稿だけを返し、リポストは含めない
- getAuthorFeed-4: filterがposts_no_repliesのとき、リプライを含めない
- getAuthorFeed-5: filterがposts_and_author_threadsのとき、リプライは親とルートがともにアクター自身の投稿であるものだけを含める
- getAuthorFeed-6: filterがposts_with_videoのとき、501とMethodNotImplementedを返す

動画の埋め込みはインデックスしていないため、posts_with_videoには対応しない。

## app.bsky.notification.listNotifications

閲覧者宛ての通知を返す。認証が必要。priorityは無視し、常に全件を返す。

- listNotifications-1: 認証がないリクエストには401を返す
- listNotifications-2: 閲覧者宛ての通知を新しい順に返す
- listNotifications-3: 既読時刻以前の通知は既読にし、それより後の通知は未読にする
- listNotifications-4: reasonsを指定すると、その種類の通知だけを返す
- listNotifications-5: seenAtに閲覧者の既読時刻を返す

## app.bsky.notification.getGroupedNotifications

閲覧者宛ての通知を、まとめた形で返す。認証が必要。公式アプリの通知画面はこのAPIだけを使う。

まとめるのは1ページ内の通知だけで、ページをまたいだ同じ投稿へのいいねは別のグループになる。

- getGroupedNotifications-1: 認証がないリクエストには401を返す
- getGroupedNotifications-2: 同じ投稿へのいいねとリポストは、種類ごとに1つのグループにまとめる
- getGroupedNotifications-3: フィードジェネレーターへのいいねは、フィードジェネレーターごとに1つのグループにまとめる
- getGroupedNotifications-4: フォローは1つのグループにまとめる
- getGroupedNotifications-5: 返信・引用・メンションはまとめずに1件ずつ返す
- getGroupedNotifications-6: relatedViewsに、グループが参照するアクターと投稿とフィードジェネレーターのビューを返す
- getGroupedNotifications-7: グループの中で最新の通知が既読時刻以前なら、グループを既読にする
- getGroupedNotifications-8: feedにconversationsを指定すると返信・引用・メンションだけを、followersを指定するとフォローだけを返す
- getGroupedNotifications-9: feedにpeople-i-followかactivityを指定すると、501とMethodNotImplementedを返す

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
- getFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getFollows

指定したアクターがフォローしているアクターを返す。認証は任意。

- getFollows-1: 指定したアクターをsubjectに、そのフォロー先をfollowsにprofileViewで返す
- getFollows-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getList

指定したリストとそのリストに追加されたアクターを返す。認証は任意。

- getList-1: 指定したリストのlistViewと、リストに追加されたアクターのprofileViewをitemsで返す
- getList-2: 保存されていないリストには400を返す

## app.bsky.graph.getLists

指定したアクターが作成したリストを返す。認証は任意。

- getLists-1: 指定したアクターが作成したリストをlistViewで返す
- getLists-2: purposesを指定すると、その用途のリストだけを返す

## me.subsco.server.getMembers

サーバーのメンバー（サブスクライバー）のプロフィールを返す。メンバー一覧は公開情報とし、認証は不要。limitとcursorでページングする。

- getMembers-1: メンバーごとにprofileViewを返す
- getMembers-2: メンバーごとに管理者かどうかを返す

## me.subsco.server.getSetupStatus

サーバーの初期設定が済んでいるかを返す。認証は不要。

- getSetupStatus-1: 管理者が未登録ならinitializedをfalseにする
- getSetupStatus-2: 管理者が登録済みならinitializedをtrueにする

## me.subsco.server.getTrackedActors

追跡アクターのprofileViewと、その追跡アクターをフォローしているサブスクライバーの数、追跡アクターの総数を返す。認証が必要。limitとcursorでページングする。

- getTrackedActors-1: サブスクライバーとそのフォロイーを返し、それ以外のアクターは含めない
- getTrackedActors-2: フォローしているサブスクライバーが多い順に並べる
- getTrackedActors-3: totalにはページングに関係なく追跡アクターの総数を入れる

## me.subsco.sync.subscribeServer

閲覧者をサブスクライバーとして登録し、Tapに閲覧者のリポジトリを追加する。認証が必要。

- subscribeServer-1: 1つの招待コードは同時に使われても1人しか登録せず、他のリクエストには400を返す
- subscribeServer-2: BANされたアカウントは登録せず、400とBannedを返す
- subscribeServer-3: 管理者以外は、有効期限内の未使用の招待コードがなければ登録せず、400とInvalidInviteCodeを返す
- subscribeServer-4: 登録済みのアカウントは登録せず、400とAlreadySubscribedを返す
- subscribeServer-5: 管理者は招待コードなしで登録する
- subscribeServer-6: 登録に使った招待コードを使用済みにする
- subscribeServer-7: 登録したアカウントのsyncTapRepoジョブを積む
- subscribeServer-8: DBにないアカウントも登録する

## me.subsco.sync.unsubscribeServer

閲覧者のサブスクライバー登録を解除する。認証が必要。

- unsubscribeServer-1: 本人とそのフォロイーのsyncTapRepoジョブを積む
- unsubscribeServer-2: 登録を消し、使った招待コードは使用済みのまま残す
- unsubscribeServer-3: 登録していなければ400とNotSubscribedを返す

## me.subsco.sync.getSubscriptionStatus

閲覧者がサブスクライバーかどうかを返す。認証が必要。

- getSubscriptionStatus-1: 閲覧者がサブスクライバーならisSubscriberをtrueにする
- getSubscriptionStatus-2: 閲覧者がサブスクライバーでなければisSubscriberをfalseにする

## me.subsco.admin.verifyAccess

閲覧者の管理画面へのアクセス権を返す。認証が必要。

- verifyAccess-1: 閲覧者が管理者ならstatusをauthorizedにする
- verifyAccess-2: 閲覧者が管理者でなければstatusをunauthorizedにする

## me.subsco.admin.registerAdmin

管理者が未登録のとき、閲覧者を最初の管理者として登録する。認証が必要。

- registerAdmin-1: 閲覧者を管理者にし、サブスクライバーにする
- registerAdmin-2: 既に管理者がいれば、400とAdminAlreadyExistsを返す
- registerAdmin-3: 閲覧者のsyncTapRepoジョブを積む
- registerAdmin-4: 閲覧者のプロフィールのfetchRecordジョブを積む
- registerAdmin-5: 閲覧者のハンドルが未取得ならresolveDidジョブを積む

## me.subsco.admin.getSubscribers

サブスクライバーのプロフィール、管理者かどうか、登録日時、取り込み状態と、サブスクライバーの総数を返す。管理者の認証が必要。limitとcursorでページングする。

- getSubscribers-1: 認証がないリクエストには401を返す
- getSubscribers-2: 管理者でないアカウントからのリクエストには403を返す
- getSubscribers-3: サブスクライバーごとにprofileViewと管理者かどうかを返す
- getSubscribers-4: テイクダウンされたサブスクライバーも含める
- getSubscribers-5: サブスクライバーごとに登録日時をsubscribedAtとして返す
- getSubscribers-6: ページングに関係なくサブスクライバーの総数をtotalとして返す
- getSubscribers-7: サブスクライバー本人とフォロー先の全員のバックフィルが完了していれば、backfillStatusをcompletedにする
- getSubscribers-8: サブスクライバー本人とフォロー先に1人でもバックフィルがエラーのアカウントがいれば、backfillStatusをerrorにする
- getSubscribers-9: completedでもerrorでもなければ、backfillStatusをinProgressにする

バックフィルの状態はworkerがactorsに保存したもの（[backfill-1](./worker.md#バックフィルの状態の確認)）を読む。状態をまだ確認していないアカウントは完了していないものとして扱う。

## me.subsco.admin.grantAdmin

指定したサブスクライバーを管理者にする。管理者の認証が必要。

- grantAdmin-1: 指定したサブスクライバーを管理者にする
- grantAdmin-2: サブスクライバーでないアクターには400とNotSubscribedを返す

## me.subsco.admin.banSubscriber

サブスクライバーの登録を解除し、BANする。管理者の認証が必要。登録していなければ400とNotSubscribedを返す。

- banSubscriber-1: 管理者はBANせず、400とCannotBanAdminを返す
- banSubscriber-2: 本人とそのフォロイーのsyncTapRepoジョブを積む

## me.subsco.admin.getBannedActors

BANされたアクターのプロフィールを返す。管理者の認証が必要。limitとcursorでページングする。

- getBannedActors-1: BANされたアクターのprofileViewを返す
- getBannedActors-2: BANされていないアクターは含めない

## me.subsco.admin.unbanActor

アカウントのBANを解除する。管理者の認証が必要。サブスクライバーには戻さず、本人が改めて登録する。

- unbanActor-1: BANを解除したアカウントは招待コードで再登録できる
- unbanActor-2: BANされていないアカウントには400とNotBannedを返す

## me.subsco.admin.createInviteCode

招待コードを作る。管理者の認証が必要。

- createInviteCode-1: コードは公開URLのホスト名の「.」を「-」に置き換え、「-」と英小文字・数字のランダムな5文字を続けたものにする
- createInviteCode-2: 有効期限はdaysToExpire日後にする

ランダムな5文字は推測されないよう暗号論的乱数で作る。

## me.subsco.admin.getInviteCodes

招待コードを、使用日時と使用したアクターとともに返す。管理者の認証が必要。limitとcursorでページングする。

- getInviteCodes-1: 使用済みの招待コードには使用したアクターのprofileViewを含める
- getInviteCodes-2: 使用したアクターがテイクダウンされていてもprofileViewを含める

## me.subsco.admin.deleteInviteCode

未使用の招待コードを削除する。管理者の認証が必要。

- deleteInviteCode-1: 存在しない招待コードには400とInviteCodeNotFoundを返す
- deleteInviteCode-2: 使用済みの招待コードには400とInviteCodeAlreadyUsedを返す
