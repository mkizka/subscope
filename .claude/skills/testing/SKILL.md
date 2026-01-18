---
name: testing
description: テストコードを書く・修正する前に必ず参照する。テスト作成・修正・レビュー・リファクタリング時に使用。
---

## テストケース名の規則

日本語で「(条件)場合、(期待値)」形式で記述する。

**良い例**:

- "投稿が見つからない場合はnotFoundPostを返す"
- "フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す"
- "subscriberの投稿は保存すべき"

**悪い例**:

- "正しいデータを返す"
- "エラーハンドリング"

## Arrange-Act-Assertパターン

全てのテストケースは以下の構造で記述する:

```typescript
test("(条件)場合、(期待値)", async () => {
  // arrange
  // テストデータの準備
  // act
  // テスト対象の実行
  // assert
  // 結果の検証
});
```

**act & assertを同じ行で書く場合**:

```typescript
test("handleが解決できない場合、HandleResolutionErrorをスローする", async () => {
  // arrange
  const uri = new AtUri("at://notfound.example/app.bsky.feed.post/abc123");

  // act & assert
  await expect(atUriService.resolveHostname(uri)).rejects.toThrow(
    HandleResolutionError,
  );
});
```

## 詳細なガイド

**テストパターンと実装例**: [references/patterns.md](references/patterns.md)を参照

- データベース使用パターン（Repository層）
- インメモリ実装パターン（Application/Domain層）
- recordFactoryの使用例
- インメモリリポジトリのセットアップ
- ctxオブジェクトの使用
- テストすべきケース
- レイヤー別の使い分け

**アサーション**: [references/assertions.md](references/assertions.md)を参照

- toMatchObjectで部分一致
- 配列の部分一致
- エラーの検証

**Factoryの使い方**: [references/factories.md](references/factories.md)を参照

- @repo/test-utils のFactory（データベース使用）
- @repo/common/test のファクトリ関数（インメモリ）
- 使い分けガイド

## インメモリリポジトリの重要な注意

Application/Domain層のテストでインメモリリポジトリを使用する場合、テスト間のデータ分離が自動的に行われる:

- `vitest.unit.setup.ts`で`setupFiles()`が呼ばれ、`beforeEach`で全てのインメモリリポジトリが`.clear()`される
- 新しいアプリを作成する場合は`vitest.unit.setup.ts`に`setupFiles()`の呼び出しを記述する必要がある

## コメントとコードスタイル

- テストケースにはarrange-act-assertパターンに基づいたコメントを必ず書く
- プロダクションコードにはコメントを追加しない
- プロダクションコードに既に存在するコメントは削除しない
