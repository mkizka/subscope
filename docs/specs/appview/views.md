# AppView仕様: ビューの共通ルール

## テイクダウン

モデレーションサービスがテイクダウンしたアカウントや投稿と、PDSで停止されたアカウントを、APIの応答から隠す。データは消さないので、ラベルが取り消されたりアカウントが再開されたりすれば元に戻る。

- takedown-1: `!takedown` か `!suspend` のラベルが付いたアカウントと投稿は応答に含めない
- takedown-2: テイクダウンされたアカウントの投稿は応答に含めない
- takedown-3: 期限が切れたラベルは無視する
- takedown-4: 状態が takendown、suspended、deactivated のアカウントとその投稿は応答に含めない

## ラベル

モデレーションサービスが付けたラベルと、作成者がレコードに付けたセルフラベルを、プロフィールと投稿のビューの labels に載せる。公式クライアントは labels を見て警告やぼかしを表示する。

- labels-1: プロフィールのビューの labels に、そのアカウントのDIDに付いたラベルを含める
- labels-2: 投稿のビューの labels に、その投稿に付いたラベルを含める
- labels-3: プロフィールのビューの labels に、プロフィールレコードに付いたラベルを含める
- labels-4: プロフィールのビューの labels に、プロフィールレコードのセルフラベルを含める
- labels-5: 投稿のビューの labels に、投稿レコードのセルフラベルを含める
- labels-6: 引用された投稿のビューの labels に、その投稿に付いたラベルを含める

セルフラベルはレコードの作成者をsrc、レコードのURIとCIDをuriとcid、レコードのcreatedAtをctsとしたラベルとして返す。

## ラベラーの指定

クライアントが `atproto-accept-labelers` ヘッダーで指定したラベラー（モデレーションサービス）のラベルだけを labels に載せる。公式クライアントは、アカウントが登録したラベラーをこのヘッダーで送る。getPostsだけが対応する。

- labelers-1: labels には、`atproto-accept-labelers` ヘッダーで指定されたラベラーが付けたラベルだけを含める
- labelers-2: `atproto-accept-labelers` ヘッダーがないか不正な場合は、すべてのラベラーのラベルを labels に含める
- labelers-3: `atproto-accept-labelers` ヘッダーで指定されたラベラーを、応答の `atproto-content-labelers` ヘッダーで返す
- labelers-4: テイクダウンは`atproto-accept-labelers` ヘッダーで指定されていないラベラーのラベルでも適用する

ヘッダーの `redact` パラメーターは応答の `atproto-content-labelers` ヘッダーにそのまま返すだけで、テイクダウンの適用には使わない。

## 返信制限

スレッドの起点の投稿者がthreadgateで決めた返信できる人を、postViewに反映する。

- threadgate-1: スレッドの起点の投稿はそのthreadgateをthreadgateに含める
- threadgate-2: 閲覧者がthreadgateで返信を許されていないスレッドの投稿は、viewer.replyDisabledをtrueにする
- threadgate-3: 起点の投稿者と、allowの規則(mentionRule・followingRule・followerRule)のどれかに合う閲覧者は、viewer.replyDisabledをfalseにする
- threadgate-4: allowが無いthreadgateは、閲覧者のviewer.replyDisabledをfalseにする
- threadgate-5: allowのlistRuleのリストに入っている閲覧者は、viewer.replyDisabledをfalseにする
- threadgate-6: allowのlistRuleで指定したリストのうちインデックスしたものを、threadgate.listsにlistViewBasicとして含める

リストに入っているかはインデックスしたlistitemで判定する。

## 引用制限

投稿者がpostgateで決めた引用の禁止と切り離しを、postViewに反映する。

- postgate-1: postgateのembeddingRulesにdisableRuleがある投稿は、投稿者以外の閲覧者のviewer.embeddingDisabledをtrueにする
- postgate-2: 引用された投稿のpostgateのdetachedEmbeddingUrisに引用した投稿が含まれる場合、引用をviewDetachedにする

## 埋め込み

投稿に埋め込まれた画像・動画・リンクカード・引用を、postViewのembedに公式AppViewと同じ形で返す。

- embed-1: gallery埋め込みの画像は引用のmediaにあるものを含めてapp.bsky.embed.gallery#viewとして返す
- embed-2: 動画の埋め込みは再生用のplaylistとサムネイルをvideo.bsky.appのURLにしてapp.bsky.embed.video#viewとして返す

## フォロー状態

閲覧者がフォローしているアカウントには、どのAPIでも同じようにviewer.followingを返す。

- viewerFollowing-1: 閲覧者がフォローしているアカウントのビュー(profileViewのほか、投稿のauthor、フィードジェネレーターのcreatorなど)には、viewer.followingにそのフォローのURIを含める

## フィード

getTimeline、getAuthorFeed、getActorLikes、getListFeed は投稿をfeedViewPostで返す。

- feedViewPost-1: リプライにはスレッドの起点と親の投稿をreplyに含める
- feedViewPost-2: 起点や親の投稿が見つからない場合、replyのその投稿をnotFoundPostにする
- feedViewPost-3: リポストにはリポストしたアカウントとリポストの日時をreasonに含める
