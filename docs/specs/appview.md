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

クライアントが `atproto-accept-labelers` ヘッダーで指定したラベラー（モデレーションサービス）のラベルだけを labels に載せる。公式クライアントは、アカウントが登録したラベラーをこのヘッダーで送る。今はgetPostsだけが対応する。

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

## 埋め込み

投稿に埋め込まれた画像・動画・リンクカード・引用を、postViewのembedに公式AppViewと同じ形で返す。

- embed-1: gallery埋め込みの画像は、引用のmediaにあるものを含めてapp.bsky.embed.gallery#viewとして返す
- embed-2: 動画の埋め込みは、再生用のplaylistとサムネイルをvideo.bsky.appのURLにしてapp.bsky.embed.video#viewとして返す

## フィード

getTimeline、getAuthorFeed、getActorLikes、getListFeed は投稿をfeedViewPostで返す。

- feedViewPost-1: リプライには、スレッドの起点と親の投稿をreplyに含める
- feedViewPost-2: 起点や親の投稿が見つからない場合、replyのその投稿をnotFoundPostにする
- feedViewPost-3: リポストには、リポストしたアカウントとリポストの日時をreasonに含める

## app.bsky.actor.getProfile

指定したアカウントの詳細なプロフィールを返す。認証は任意。

- getProfile-1: 指定したアカウントのprofileViewDetailedを返す
- getProfile-2: 保存されていないアカウントには400を返す
- getProfile-3: プロフィールレコードがないアカウントには、DIDとハンドルだけのprofileViewDetailedを返す
- getProfile-4: テイクダウンされたアカウントと、状態が takendown か suspended のアカウントには400とAccountTakedownを返す
- getProfile-5: 状態が deactivated のアカウントには400とAccountDeactivatedを返す
- getProfile-6: プロフィールレコードのlinksが指す app.bsky.actor.link レコードを、linksの順にprofileLinkViewで返す
- getProfile-7: 保存されていないリンクとテイクダウンされたリンクは、linksに含めない

## app.bsky.actor.getProfiles

指定した複数アカウントの詳細なプロフィールを返す。認証は任意。

- getProfiles-1: DIDとハンドルのどちらでも指定でき、見つかったアカウントだけを指定した順に返す

## app.bsky.actor.searchActors

表示名またはハンドルが検索語に部分一致するアカウントを返す。認証は任意。

- searchActors-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアカウントをprofileViewで返す
- searchActors-2: ハンドルが検索語に部分一致するアカウントも返す
- searchActors-3: 空白だけの検索語には何も返さない
- searchActors-4: cursorを指定すると、前のページに含めなかったアカウントを返す

## app.bsky.actor.searchActorsTypeahead

入力補完用に、表示名またはハンドルが検索語に部分一致するアカウントを返す。認証は任意。

- searchActorsTypeahead-1: 表示名が検索語に大文字・小文字を区別せず部分一致するアカウントをprofileViewBasicで返す
- searchActorsTypeahead-2: ハンドルが検索語に部分一致するアカウントも返す
- searchActorsTypeahead-3: 空白だけの検索語には何も返さない

## app.bsky.actor.getPreferences

閲覧者の設定を返す。設定の保存には対応していないため、固定の設定を返す。

- getPreferences-1: Followingフィードをピン留めした設定を返す

## app.bsky.feed.getTimeline

閲覧者のホームタイムラインを返す。認証が必要。

- getTimeline-1: 認証がないリクエストには401を返す
- getTimeline-2: 閲覧者本人とフォロー先の投稿・リポストを含める
- getTimeline-3: フォロー先以外の投稿・リポストは含めない
- getTimeline-4: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す
- getTimeline-5: 投稿者にプロフィールレコードがなくても投稿を含め、authorはDIDとハンドルだけにする

## app.bsky.feed.getListFeed

指定したリストのメンバーの投稿とリポストを新しい順に返す。認証は任意。

- getListFeed-1: リストのメンバーの投稿だけをfeedViewPostで返す

## app.bsky.feed.getActorLikes

指定したアカウントがいいねした投稿を新しい順に返す。認証は任意。

- getActorLikes-1: 指定したアカウントがいいねした投稿をfeedViewPostで返す

## app.bsky.feed.getLikes

指定した投稿へのいいねを新しい順に返す。認証は任意。

- getLikes-1: 指定した投稿にいいねしたアカウントをprofileViewで返す
- getLikes-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.feed.getRepostedBy

指定した投稿をリポストしたアカウントを新しい順に返す。認証は任意。

- getRepostedBy-1: 指定した投稿をリポストしたアカウントをprofileViewで返す
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

指定したアカウントの投稿とリポストを新しい順に返す。認証は任意。

- getAuthorFeed-1: 指定したアカウントの投稿をfeedViewPostで返す
- getAuthorFeed-2: 解決できないハンドルには400を返す
- getAuthorFeed-3: filterがposts_with_mediaのとき、画像を添付したアカウント自身の投稿だけを返し、リポストは含めない
- getAuthorFeed-4: filterがposts_no_repliesのとき、リプライを含めない
- getAuthorFeed-5: filterがposts_and_author_threadsのとき、リプライは親とルートがともにアカウント自身の投稿であるものだけを含める
- getAuthorFeed-6: filterがposts_with_videoのとき、動画を添付したアカウント自身の投稿だけを返し、リポストは含めない

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
- getGroupedNotifications-6: relatedViewsに、グループが参照するアカウントと投稿とフィードジェネレーターのビューを返す
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

指定したアカウントをフォローしているアカウントを返す。認証は任意。

- getFollowers-1: 指定したアカウントをsubjectに、そのフォロワーをfollowersにprofileViewで返す
- getFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getFollows

指定したアカウントがフォローしているアカウントを返す。認証は任意。

- getFollows-1: 指定したアカウントをsubjectに、そのフォロー先をfollowsにprofileViewで返す
- getFollows-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getList

指定したリストとそのリストに追加されたアカウントを返す。認証は任意。

- getList-1: 指定したリストのlistViewと、リストに追加されたアカウントのprofileViewをitemsで返す
- getList-2: 保存されていないリストには400を返す

## app.bsky.graph.getLists

指定したアカウントが作成したリストを返す。認証は任意。

- getLists-1: 指定したアカウントが作成したリストをlistViewで返す
- getLists-2: purposesを指定すると、その用途のリストだけを返す

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

サーバーの運営者のprofileViewを返す。運営者は、管理者のうち最初にサーバーに登録した1人。認証は不要。

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

バックフィルの状態はworkerがaccountsに保存したもの（[backfill-1](./worker.md#バックフィルの状態の確認)）を読む。

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
