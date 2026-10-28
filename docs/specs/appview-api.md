# AppView API仕様

各項目は `apps/appview/src/presentation/routes` 以下のAPIテストと1対1で対応する。見出しのNSIDがテストの`describe`名、箇条書きがテスト名と一致する。

## app.bsky.actor.getProfile

- プロフィールがある場合、profileViewDetailedを返す
- アクターが存在しない場合、400を返す

## app.bsky.feed.getTimeline

- 認証がない場合、401を返す
- フォロイーの投稿がある場合、feedViewPostとして返す
