# アサーションのベストプラクティス

## toMatchObjectで部分一致

オブジェクトの一部のプロパティのみを検証する場合:

```typescript
expect(result).toMatchObject({
  feed: [
    {
      $type: "app.bsky.feed.defs#feedViewPost",
      post: {
        uri: post.uri,
        author: {
          displayName: "Expected User",
        },
      },
    },
  ],
});
```

## 配列の部分一致

配列内に特定の要素が含まれることを検証する場合:

```typescript
expect(actorStatsJobs).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      data: {
        did: author.did,
        type: "posts",
      },
    }),
  ]),
);
```

## エラーの検証

### エラークラスのみを検証

```typescript
await expect(service.execute(uri)).rejects.toThrow(HandleResolutionError);
```

### エラーメッセージも検証

```typescript
await expect(service.execute(uri)).rejects.toThrow(
  "Failed to resolve handle: notfound.example",
);
```

## スナップショット

オブジェクト全体を検証する場合（注意して使用）:

```typescript
expect(result).toMatchSnapshot();
```

**注意**: スナップショットは変更に弱いため、具体的なアサーションが書ける場合はそちらを優先する。
