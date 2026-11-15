# AppView仕様: app.bsky.actor

## app.bsky.actor.getProfile

指定したアカウントの詳細なプロフィールを返す。認証は任意。

| ID            | 仕様                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| getProfile-1  | 指定したアカウントのprofileViewDetailedを返す                                                                        |
| getProfile-2  | 保存されていないアカウントには400を返す                                                                              |
| getProfile-3  | プロフィールレコードがなければ、DIDとハンドルだけを返す                                                              |
| getProfile-4  | テイクダウンされたアカウントと、状態が takendown か suspended のアカウントには、400とAccountTakedownを返す           |
| getProfile-5  | 状態が deactivated のアカウントには、400とAccountDeactivatedを返す                                                   |
| getProfile-6  | プロフィールのlinksが指すリンクを、その順にlinksで返す                                                               |
| getProfile-7  | 保存されていないリンクとテイクダウンされたリンクは、linksに含めない                                                  |
| getProfile-8  | 閲覧者がフォローしているフォロワーを、閲覧者がフォローした新しい順に最大5件、総数とともにviewer.knownFollowersで返す |
| getProfile-9  | 該当するフォロワーがいない場合、未ログインの場合、閲覧者自身の場合は、viewer.knownFollowersを含めない                |
| getProfile-10 | プロフィールのpinnedPostを返す                                                                                       |

## app.bsky.actor.getProfiles

指定した複数アカウントの詳細なプロフィールを返す。認証は任意。

| ID            | 仕様                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| getProfiles-1 | DIDとハンドルのどちらでも指定でき、見つかったアカウントだけを指定した順に返す |
| getProfiles-2 | getProfileと同じくviewer.knownFollowersを含める                               |

## app.bsky.actor.searchActors

表示名かハンドルが検索語に部分一致するアカウントを返す。認証は任意。

| ID             | 仕様                                                                  |
| -------------- | --------------------------------------------------------------------- |
| searchActors-1 | 表示名が大文字・小文字を区別せず一致するアカウントをprofileViewで返す |
| searchActors-2 | ハンドルが一致するアカウントは、プロフィールレコードがなくても返す    |
| searchActors-3 | 空白だけの検索語には何も返さない                                      |
| searchActors-4 | cursorを指定すると、前のページの続きを返す                            |

## app.bsky.actor.searchActorsTypeahead

入力補完用に、searchActorsと同じ条件でアカウントを返す。認証は任意。

| ID                      | 仕様                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| searchActorsTypeahead-1 | 表示名が大文字・小文字を区別せず一致するアカウントをprofileViewBasicで返す |
| searchActorsTypeahead-2 | ハンドルが一致するアカウントは、プロフィールレコードがなくても返す         |
| searchActorsTypeahead-3 | 空白だけの検索語には何も返さない                                           |

## app.bsky.actor.getPreferences

閲覧者の設定を返す。設定の保存には対応していないため、固定の設定を返す。

| ID               | 仕様                                      |
| ---------------- | ----------------------------------------- |
| getPreferences-1 | Followingフィードをピン留めした設定を返す |
