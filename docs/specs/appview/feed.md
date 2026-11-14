# AppView仕様: app.bsky.feed

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

## app.bsky.feed.getQuotes

指定した投稿を引用した投稿を新しい順に返す。認証は任意。

- getQuotes-1: 指定した投稿を引用した投稿をpostViewで返す
- getQuotes-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.feed.getFeedGenerators

指定したフィードジェネレーターの情報を返す。認証は任意。

- getFeedGenerators-1: 指定したフィードジェネレーターをgeneratorViewで返す

## app.bsky.feed.searchPosts

本文が検索クエリに一致する投稿を新しい順に返す。認証は任意。

- searchPosts-1: 本文がクエリに一致する投稿をpostViewで返す

## app.bsky.feed.searchPostsV2

searchPostsの後継で、公式クライアントの投稿検索はこれを使う。認証は任意。

- searchPostsV2-1: queryを空白で区切った語をすべて本文に含む投稿をpostViewで返す
- searchPostsV2-2: queryを省略した場合、authorsで絞り込んだ投稿を返す
- searchPostsV2-3: repliesOnlyがtrueなら返信だけ、excludeRepliesがtrueなら返信以外だけを返す。どちらも無ければ返信も含める
- searchPostsV2-4: queryもauthorsも無い場合、空の配列を返す
- searchPostsV2-6: queryに`from:me`が含まれる場合、それを語として扱わず、閲覧者をauthorsに加える
- searchPostsV2-7: 未ログインで`from:me`を含むqueryの場合、空の配列を返す

次のパラメータは対応を見送り、無視する。PoCとして公式クライアントの基本機能の再現を優先し、これらは無くても結果が返る便利機能のため。

- sort=top(常に新しい順で返す)
- since、until
- languages
- `to:me`(queryに含まれていても、ただの語として扱う)
- hashtags、mentions、domains、urls(絞り込みには使わない)

hashtags、mentions、domains、urlsを無視する理由は、公式AppView内蔵の検索実装(atprotoのpackages/bsky/src/data-plane/server/routes/search.ts)も本文のLIKEとauthorsの先頭しか見ず、これらを無視しているため。本番のbskyでは別の検索サービスが絞り込みを担っている。公式アプリ1.137系はハッシュタグ画面でqueryを空にしてhashtagsだけを送るため、その版では0件になる。現在の本番の公式アプリは旧APIのsearchPostsを`q=#タグ`で呼び、本文検索で見つかる。

## app.bsky.feed.getPosts

指定したURIの投稿をpostViewとして返す。認証は任意。

- getPosts-1: 指定したURIの順に投稿を並べる
- getPosts-2: 存在しない投稿は含めない
- getPosts-3: 閲覧者がいいね・リポストした投稿は、そのURIをviewer.likeとviewer.repostに含める
- getPosts-4: 閲覧者のプロフィールにピン留めされた投稿は、viewer.pinnedをtrueにする

## app.bsky.feed.getPostThread

指定した投稿を中心に、親投稿とリプライを含むスレッドを返す。認証は任意。

- getPostThread-1: 指定した投稿の親投稿とリプライをthreadViewPostに含める
- getPostThread-2: 存在しない投稿には400とNotFoundを返す

## app.bsky.unspecced.getPostThreadV2

アンカー投稿を中心に、親投稿とリプライを深さ付きの平坦なリストで返す。認証は任意。リプライは古い順に並べる。sortは、PoCでは基本機能を優先するため無視し、hasOtherRepliesは常にfalseを返す。

threadgateのhiddenRepliesは反映せず、隠されたリプライも通常の位置に返す。hiddenByThreadgateは常にfalseを返し、getPostThreadOtherV2は実装しない。PoCでは基本機能の再現を優先し、スレッド主がリプライを隠す機能はSNSを便利にする補助機能のため後回しにした。

- getPostThreadV2-1: 親投稿を負のdepth、アンカー投稿をdepth 0、リプライを正のdepthとして、上から順にthreadに含める
- getPostThreadV2-2: aboveがfalseのとき、親投稿を含めない
- getPostThreadV2-3: 存在しない投稿はdepth 0のthreadItemNotFoundとして返す
- getPostThreadV2-4: アンカー投稿への直接のリプライは、件数に関わらず全て含める
- getPostThreadV2-5: depth 1より深いリプライは、投稿ごとにbranchingFactor件までを古い順に含める
- getPostThreadV2-6: 各threadItemPostのmoreRepliesに、replyCountから含めたリプライ数を引いた数(0未満は0)を返す

## app.bsky.feed.getAuthorFeed

指定したアカウントの投稿とリポストを新しい順に返す。認証は任意。

- getAuthorFeed-1: 指定したアカウントの投稿をfeedViewPostで返す
- getAuthorFeed-2: 解決できないハンドルには400を返す
- getAuthorFeed-3: filterがposts_with_mediaのとき、画像を添付したアカウント自身の投稿だけを返し、リポストは含めない
- getAuthorFeed-4: filterがposts_no_repliesのとき、リプライを含めない
- getAuthorFeed-5: filterがposts_and_author_threadsのとき、リプライは親とルートがともにアカウント自身の投稿であるものだけを含める
- getAuthorFeed-6: filterがposts_with_videoのとき、動画を添付したアカウント自身の投稿だけを返し、リポストは含めない
- getAuthorFeed-7: includePinsがtrueで1ページ目のとき、プロフィールのピン留め投稿を先頭にreasonPin付きで返し、元の位置からは除く
- getAuthorFeed-8: cursorがあるページと、アカウント以外の投稿がピン留めされている場合は、ピン留め投稿を先頭に入れない
