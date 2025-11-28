# ドメインモデル統一化移行計画

## 目標

すべてのドメインモデルを、既に移行済みのActorモデルと同じパターン（private constructor + create/reconstruct）に統一する。

**対象:** Post, Follow, Like, Repost, Profile, ProfileDetailed, Generator, FeedItem
**対象外:** Actor (移行済み), InviteCode, Subscription, Record (特殊実装)

## 実装パターン

### Actorモデル（参考実装）

```typescript
class Actor {
  private constructor(params: ActorParams) {
    /* ... */
  }

  // 新規作成用: 必要最小限の引数、デフォルト値を設定
  static create(params: {
    did: string;
    handle?: string | null;
    indexedAt: Date;
  }): Actor {
    return new Actor({
      did: params.did,
      handle: params.handle ?? null,
      syncRepoStatus: "dirty",
      syncRepoVersion: null,
      indexedAt: params.indexedAt,
    });
  }

  // DB再構築用: すべてのプロパティを受け取る
  static reconstruct(params: ActorParams): Actor {
    return new Actor(params);
  }
}
```

### 適用方針

1. **constructor**: privateに変更
2. **create()**: 新規作成用、必須プロパティのみ引数で受け取り、デフォルト値を設定
3. **reconstruct()**: DB再構築用、すべてのプロパティを受け取る
4. **from()**: 既存メソッドはcreate()を内部で使用

---

## 進捗チェックリスト

### Phase 1-A: Followモデルの移行

- [ ] Follow.ts修正（private constructor + create/reconstruct 追加）
- [ ] FollowRepository修正（`new Follow()` → `Follow.reconstruct()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 1-B: Likeモデルの移行

- [ ] Like.ts修正（private constructor + create/reconstruct 追加）
- [ ] LikeRepository修正（`new Like()` → `Like.reconstruct()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 1-C: Repostモデルの移行

- [ ] Repost.ts修正（private constructor + create/reconstruct 追加）
- [ ] RepostRepository修正（`new Repost()` → `Repost.reconstruct()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 2-A: Profileモデルの移行

- [ ] Profile.ts修正（private constructor + create/reconstruct 追加）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 2-B: ProfileDetailedモデルの移行

- [ ] ProfileDetailed.ts修正（private constructor + create/reconstruct 追加）
- [ ] ProfileRepository修正（`new ProfileDetailed()` → `ProfileDetailed.reconstruct()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 3-A: Postドメインモデルの修正

- [ ] Post.ts修正（private constructor + create/reconstruct 追加、from()でcreate()使用）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 3-B: Post使用箇所の修正

- [ ] PostRepository修正（`new Post()` → `Post.reconstruct()`）
- [ ] reply-ref-service.test.ts修正（`new Post()` → `Post.create()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 4: Generatorモデルの移行

- [ ] Generator.ts修正（private constructor + create/reconstruct 追加）
- [ ] GeneratorRepository修正（`new Generator()` → `Generator.reconstruct()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 5-A: FeedItemドメインモデルの修正

- [ ] FeedItem.ts修正（private constructor + create/reconstruct 追加）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 5-B: FeedItemリポジトリの修正

- [ ] TimelineRepository修正（`new FeedItem()` → `FeedItem.reconstruct()`）
- [ ] AuthorFeedRepository修正（`new FeedItem()` → `FeedItem.reconstruct()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 5-C: FeedItemサービス・テストの修正

- [ ] ActorLikesService修正（`new FeedItem()` → `FeedItem.create()`）
- [ ] feed-processor.test.ts修正（`new FeedItem()` → `FeedItem.create()`）
- [ ] get-timeline-use-case.test.ts修正（`new FeedItem()` → `FeedItem.create()`）
- [ ] `pnpm typecheck` 実行
- [ ] `pnpm test` 実行

### Phase 6: 最終確認

- [ ] 全アプリケーションで `pnpm typecheck` 実行
- [ ] 全アプリケーションで `pnpm test` 実行
- [ ] 全アプリケーションで `pnpm lint` 実行
- [ ] 移行完了の確認

---

## Phase 1-A: Followモデルの移行

### 対象モデル

- **Follow**: uri, cid, actorDid, subjectDid, createdAt が必須

デフォルト値: `indexedAt = new Date()`

### 修正ファイル (2ファイル)

| ファイル                                               | 変更内容                                      |
| ------------------------------------------------------ | --------------------------------------------- |
| `packages/common/src/lib/domain/follow/follow.ts`      | private constructor + create/reconstruct 追加 |
| `apps/appview/src/infrastructure/follow-repository.ts` | `new Follow()` → `Follow.reconstruct()`       |

---

## Phase 1-B: Likeモデルの移行

### 対象モデル

- **Like**: uri, cid, actorDid, subjectUri, subjectCid, createdAt が必須

デフォルト値: `indexedAt = new Date()`

### 修正ファイル (2ファイル)

| ファイル                                             | 変更内容                                      |
| ---------------------------------------------------- | --------------------------------------------- |
| `packages/common/src/lib/domain/like/like.ts`        | private constructor + create/reconstruct 追加 |
| `apps/appview/src/infrastructure/like-repository.ts` | `new Like()` → `Like.reconstruct()`           |

---

## Phase 1-C: Repostモデルの移行

### 対象モデル

- **Repost**: uri, cid, actorDid, subjectUri, subjectCid, createdAt が必須

デフォルト値: `indexedAt = new Date()`

### 修正ファイル (2ファイル)

| ファイル                                               | 変更内容                                      |
| ------------------------------------------------------ | --------------------------------------------- |
| `packages/common/src/lib/domain/repost/repost.ts`      | private constructor + create/reconstruct 追加 |
| `apps/appview/src/infrastructure/repost-repository.ts` | `new Repost()` → `Repost.reconstruct()`       |

---

## Phase 2-A: Profileモデルの移行

### 対象モデル

- **Profile**: uri, cid, actorDid が必須、他はオプショナル

デフォルト値: `avatarCid=null, bannerCid=null, description=null, displayName=null, createdAt=null, indexedAt=new Date()`

### 修正ファイル (1ファイル)

| ファイル                                            | 変更内容                                      |
| --------------------------------------------------- | --------------------------------------------- |
| `packages/common/src/lib/domain/profile/profile.ts` | private constructor + create/reconstruct 追加 |

---

## Phase 2-B: ProfileDetailedモデルの移行

### 対象モデル

- **ProfileDetailed**: Profileを継承、handleを追加

### 修正ファイル (2ファイル)

| ファイル                                                     | 変更内容                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `packages/common/src/lib/domain/profile/profile-detailed.ts` | private constructor + create/reconstruct 追加             |
| `apps/appview/src/infrastructure/profile-repository.ts`      | `new ProfileDetailed()` → `ProfileDetailed.reconstruct()` |

### 注意点

- ProfileDetailedのcreate()はProfileのプロパティもすべて受け取る
- super()呼び出しには完全なProfileParamsが必要

---

## Phase 3-A: Postドメインモデルの修正

### 対象モデル

- **Post**: 最も複雑なモデル、embedの処理あり

必須プロパティ: uri, cid, actorDid, text, createdAt
デフォルト値: `replyRoot=null, replyParent=null, langs=null, embed=null, indexedAt=new Date()`

### 修正ファイル (1ファイル)

| ファイル                                      | 変更内容                                                            |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `packages/common/src/lib/domain/post/post.ts` | private constructor + create/reconstruct 追加、from()でcreate()使用 |

### 注意点

- from()メソッドは内部でcreate()を使用
- embedの処理は現在のロジックをそのまま使用

---

## Phase 3-B: Post使用箇所の修正

### 修正ファイル (2ファイル)

| ファイル                                                              | 変更内容                            |
| --------------------------------------------------------------------- | ----------------------------------- |
| `apps/appview/src/infrastructure/post-repository.ts`                  | `new Post()` → `Post.reconstruct()` |
| `apps/appview/src/application/service/feed/reply-ref-service.test.ts` | `new Post()` → `Post.create()`      |

---

## Phase 4: Generatorモデルの移行

### 対象モデル

- **Generator**: シンプルな構造

必須プロパティ: uri, cid, actorDid, did, displayName, createdAt
デフォルト値: `description=undefined, avatarCid=undefined, indexedAt=new Date()`

### 修正ファイル (2ファイル)

| ファイル                                                  | 変更内容                                      |
| --------------------------------------------------------- | --------------------------------------------- |
| `packages/common/src/lib/domain/generator/generator.ts`   | private constructor + create/reconstruct 追加 |
| `apps/appview/src/infrastructure/generator-repository.ts` | `new Generator()` → `Generator.reconstruct()` |

---

## Phase 5-A: FeedItemドメインモデルの修正

### 対象モデル

- **FeedItem**: indexedAtを持たない特殊なモデル

すべてのプロパティが必須: uri, cid, type, subjectUri, actorDid, sortAt

### 修正ファイル (1ファイル)

| ファイル                                                | 変更内容                                      |
| ------------------------------------------------------- | --------------------------------------------- |
| `packages/common/src/lib/domain/feed-item/feed-item.ts` | private constructor + create/reconstruct 追加 |

### 注意点

- FeedItemはindexedAtを持たないため、create()とreconstruct()の引数は同じ
- fromPost()とfromRepost()はcreate()を使用

---

## Phase 5-B: FeedItemリポジトリの修正

### 修正ファイル (2ファイル)

| ファイル                                                    | 変更内容                                    |
| ----------------------------------------------------------- | ------------------------------------------- |
| `apps/appview/src/infrastructure/timeline-repository.ts`    | `new FeedItem()` → `FeedItem.reconstruct()` |
| `apps/appview/src/infrastructure/author-feed-repository.ts` | `new FeedItem()` → `FeedItem.reconstruct()` |

---

## Phase 5-C: FeedItemサービス・テストの修正

### 修正ファイル (3ファイル)

| ファイル                                                                    | 変更内容                               |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `apps/appview/src/application/service/feed/actor-likes-service.ts`          | `new FeedItem()` → `FeedItem.create()` |
| `apps/appview/src/application/service/feed/feed-processor.test.ts`          | `new FeedItem()` → `FeedItem.create()` |
| `apps/appview/src/application/use-cases/feed/get-timeline-use-case.test.ts` | `new FeedItem()` → `FeedItem.create()` |

---

## 実装例

### ドメインモデルの修正パターン

```typescript
// Before
export class Follow {
  constructor(params: FollowParams) {
    this.uri = new AtUri(params.uri);
    // ...
  }

  static from(record: Record): Follow {
    const parsed = record.validate("app.bsky.graph.follow");
    return new Follow({
      uri: record.uri,
      // ...
    });
  }
}

// After
export class Follow {
  private constructor(params: FollowParams) {
    this.uri = new AtUri(params.uri);
    // ...
  }

  static create(params: {
    uri: AtUri | string;
    cid: string;
    actorDid: string;
    subjectDid: string;
    createdAt: Date;
  }): Follow {
    return new Follow({
      ...params,
      indexedAt: new Date(),
    });
  }

  static reconstruct(params: FollowParams): Follow {
    return new Follow(params);
  }

  static from(record: Record): Follow {
    const parsed = record.validate("app.bsky.graph.follow");
    return Follow.create({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
    });
  }
}
```

### リポジトリの修正パターン

```typescript
// Before
return new Follow({
  uri: row.uri,
  cid: row.cid,
  actorDid: row.actorDid,
  subjectDid: row.subjectDid,
  createdAt: row.createdAt,
  indexedAt: row.indexedAt,
});

// After
return Follow.reconstruct({
  uri: row.uri,
  cid: row.cid,
  actorDid: row.actorDid,
  subjectDid: row.subjectDid,
  createdAt: row.createdAt,
  indexedAt: row.indexedAt,
});
```

### テストの修正パターン

```typescript
// Before
const post = new Post({
  uri: "at://did:plc:xxx/app.bsky.feed.post/xxx",
  cid: "bafy...",
  actorDid: "did:plc:xxx",
  text: "test",
  // ...すべてのプロパティを指定
});

// After
const post = Post.create({
  uri: "at://did:plc:xxx/app.bsky.feed.post/xxx",
  cid: "bafy...",
  actorDid: "did:plc:xxx",
  text: "test",
  createdAt: new Date(),
  // デフォルト値が設定されるプロパティは省略可能
});
```

---

## 修正ファイル一覧

### ドメインモデル (8ファイル)

- [packages/common/src/lib/domain/follow/follow.ts](packages/common/src/lib/domain/follow/follow.ts)
- [packages/common/src/lib/domain/like/like.ts](packages/common/src/lib/domain/like/like.ts)
- [packages/common/src/lib/domain/repost/repost.ts](packages/common/src/lib/domain/repost/repost.ts)
- [packages/common/src/lib/domain/profile/profile.ts](packages/common/src/lib/domain/profile/profile.ts)
- [packages/common/src/lib/domain/profile/profile-detailed.ts](packages/common/src/lib/domain/profile/profile-detailed.ts)
- [packages/common/src/lib/domain/post/post.ts](packages/common/src/lib/domain/post/post.ts)
- [packages/common/src/lib/domain/generator/generator.ts](packages/common/src/lib/domain/generator/generator.ts)
- [packages/common/src/lib/domain/feed-item/feed-item.ts](packages/common/src/lib/domain/feed-item/feed-item.ts)

### appviewリポジトリ (7ファイル)

- [apps/appview/src/infrastructure/follow-repository.ts](apps/appview/src/infrastructure/follow-repository.ts)
- [apps/appview/src/infrastructure/like-repository.ts](apps/appview/src/infrastructure/like-repository.ts)
- [apps/appview/src/infrastructure/repost-repository.ts](apps/appview/src/infrastructure/repost-repository.ts)
- [apps/appview/src/infrastructure/profile-repository.ts](apps/appview/src/infrastructure/profile-repository.ts)
- [apps/appview/src/infrastructure/post-repository.ts](apps/appview/src/infrastructure/post-repository.ts)
- [apps/appview/src/infrastructure/generator-repository.ts](apps/appview/src/infrastructure/generator-repository.ts)
- [apps/appview/src/infrastructure/timeline-repository.ts](apps/appview/src/infrastructure/timeline-repository.ts)
- [apps/appview/src/infrastructure/author-feed-repository.ts](apps/appview/src/infrastructure/author-feed-repository.ts)

### appviewサービス・テスト (4ファイル)

- [apps/appview/src/application/service/feed/actor-likes-service.ts](apps/appview/src/application/service/feed/actor-likes-service.ts)
- [apps/appview/src/application/service/feed/reply-ref-service.test.ts](apps/appview/src/application/service/feed/reply-ref-service.test.ts)
- [apps/appview/src/application/service/feed/feed-processor.test.ts](apps/appview/src/application/service/feed/feed-processor.test.ts)
- [apps/appview/src/application/use-cases/feed/get-timeline-use-case.test.ts](apps/appview/src/application/use-cases/feed/get-timeline-use-case.test.ts)

**合計: 20ファイル**

---

## リスクと対策

### リスク1: 大量のファイル修正による混乱

**対策:**

- Phaseごとにコミット
- 各Phase後に必ずテストを実行
- Phase 1で手順を確立し、以降のPhaseで再利用

### リスク2: from()メソッドとcreate()の二重管理

**対策:**

- from()メソッドは内部でcreate()を使用する設計
- from()の外部インターフェースは変更しない

### リスク3: ProfileDetailedの継承による複雑性

**対策:**

- ProfileとProfileDetailedを同じPhaseで移行
- super()呼び出しの引数を慎重に確認

### リスク4: テストファイルでの直接インスタンス化

**対策:**

- 各Phaseで該当ファイルを特定済み
- create()への変更を明確に記載

---

## 成功基準

1. ✅ すべてのドメインモデルがprivate constructor + create/reconstructパターンに移行完了
2. ✅ すべての型チェックがエラーなく通過
3. ✅ すべてのテストがパス
4. ✅ lintエラーがない
5. ✅ 既存機能が正常に動作

---

## 参考ファイル

- [packages/common/src/lib/domain/actor/actor.ts](packages/common/src/lib/domain/actor/actor.ts) - 既に移行済みの参考実装
- [docs/tasks/test-strategy-migration-plan.md](docs/tasks/test-strategy-migration-plan.md) - 移行計画のフォーマット参考
