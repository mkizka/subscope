# AppView仕様: app.bsky.graph

## app.bsky.graph.getFollowers

指定したアカウントをフォローしているアカウントを返す。認証は任意。

| ID             | 仕様                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| getFollowers-1 | 指定したアカウントをsubjectに、フォロワーをfollowersにprofileViewで返す |
| getFollowers-2 | 新しい順に並べ、cursorより古いものを返す                                |

## app.bsky.graph.getFollows

指定したアカウントのフォロー先を返す。認証は任意。

| ID           | 仕様                                                                  |
| ------------ | --------------------------------------------------------------------- |
| getFollows-1 | 指定したアカウントをsubjectに、フォロー先をfollowsにprofileViewで返す |
| getFollows-2 | 新しい順に並べ、cursorより古いものを返す                              |

## app.bsky.graph.getKnownFollowers

指定したアカウントのフォロワーのうち、閲覧者がフォローしているものを返す。認証は必須。

| ID                  | 仕様                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| getKnownFollowers-1 | 認証がなければ401を返す                                                                             |
| getKnownFollowers-2 | 指定したアカウントをsubjectに、閲覧者がフォローしているフォロワーだけをfollowersにprofileViewで返す |
| getKnownFollowers-3 | 閲覧者がフォローした新しい順に並べ、cursorより古いものを返す                                        |

## app.bsky.graph.getList

指定したリストと、そのリストに追加されたアカウントを返す。認証は任意。

| ID        | 仕様                                                               |
| --------- | ------------------------------------------------------------------ |
| getList-1 | リストのlistViewと、追加されたアカウントのprofileViewをitemsで返す |
| getList-2 | 保存されていないリストには400を返す                                |

## app.bsky.graph.getLists

指定したアカウントが作成したリストを返す。認証は任意。

| ID         | 仕様                                               |
| ---------- | -------------------------------------------------- |
| getLists-1 | 指定したアカウントが作成したリストをlistViewで返す |
| getLists-2 | purposesを指定すると、その用途のリストだけを返す   |

## app.bsky.graph.getListsWithMembership

閲覧者が作成したリスト（curatelistとmodlist）を、指定したactorが含まれているかとともに返す。認証は必須。

| ID                       | 仕様                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| getListsWithMembership-1 | 認証がなければ401を返す                                                                  |
| getListsWithMembership-2 | 閲覧者が作成したリストだけをlistViewで返す                                               |
| getListsWithMembership-3 | actorがリストに含まれていれば、listItemにそのリスト項目のuriとactorのprofileViewを入れる |
| getListsWithMembership-4 | purposesを指定すると、その用途のリストだけを返す                                         |
