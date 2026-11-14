# AppView仕様: app.bsky.graph

## app.bsky.graph.getFollowers

指定したアカウントをフォローしているアカウントを返す。認証は任意。

- getFollowers-1: 指定したアカウントをsubjectに、そのフォロワーをfollowersにprofileViewで返す
- getFollowers-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getFollows

指定したアカウントがフォローしているアカウントを返す。認証は任意。

- getFollows-1: 指定したアカウントをsubjectに、そのフォロー先をfollowsにprofileViewで返す
- getFollows-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getKnownFollowers

指定したアカウントをフォローしているアカウントのうち、認証したアカウントがフォローしているものを返す。認証は必須。

- getKnownFollowers-1: 認証がないリクエストには401を返す
- getKnownFollowers-2: 指定したアカウントをsubjectに、閲覧者がフォローしているそのフォロワーだけをfollowersにprofileViewで返す
- getKnownFollowers-3: 閲覧者がフォローした新しい順に並べ、cursorを指定するとそれより古いものだけを返す

## app.bsky.graph.getList

指定したリストとそのリストに追加されたアカウントを返す。認証は任意。

- getList-1: 指定したリストのlistViewと、リストに追加されたアカウントのprofileViewをitemsで返す
- getList-2: 保存されていないリストには400を返す

## app.bsky.graph.getLists

指定したアカウントが作成したリストを返す。認証は任意。

- getLists-1: 指定したアカウントが作成したリストをlistViewで返す
- getLists-2: purposesを指定すると、その用途のリストだけを返す

## app.bsky.graph.getListsWithMembership

認証したアカウントが作成したリスト(curatelistとmodlist)を、指定したactorがそのリストに含まれているかの情報とともに返す。認証は必須。

- getListsWithMembership-1: 認証がないリクエストには401を返す
- getListsWithMembership-2: 閲覧者が作成したリストだけをlistViewで返し、他のアカウントのリストは含めない
- getListsWithMembership-3: actorがリストに含まれている場合は、listItemにlist itemのuriとactorのprofileViewを入れる
- getListsWithMembership-4: purposesを指定すると、その用途のリストだけを返す
