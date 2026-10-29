# Worker仕様

用語は[用語集](../glossary.md)を参照する。

## 通知の生成

レコードをインデックスするときに、サブスクライバー宛ての通知を作る。

- notify-1: 通知はサブスクライバー宛てにだけ作る
- notify-2: 自分自身の操作では通知を作らない
- notify-3: いいねされた投稿の作者に like の通知を作る
- notify-4: リポストされた投稿の作者に repost の通知を作る
- notify-5: フォローされたアカウントに follow の通知を作る
- notify-6: リプライの親投稿を含めて4つ上までの投稿の作者に reply の通知を作る
- notify-7: 引用された投稿の作者に quote の、メンションされたアカウントに mention の通知を作る
- notify-8: 1つの投稿から同じ相手への通知は reply > quote > mention の優先順で1件にする

リプライの祖先は保存済みの投稿だけをたどれるので、未保存の投稿より上の作者には通知しない。

v1.0では次の通知は作らない。

- 追跡アクター以外からの通知。Tapから受信しないため届かない。v1.0後に検討する
- 上記以外のreason（starterpack-joined、verified、like-via-repost、subscribed-postなど）
