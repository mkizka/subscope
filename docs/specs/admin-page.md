# 管理画面仕様

## 概要

- apps/subscope に実装
- `/admin` でアクセス

## 機能

- 登録ユーザーの管理
- 招待コードの管理

## 画面遷移

### アクセス時の処理

1. `/trpc/admin.verifyAccess` を呼び出す（BFFが `me.subsco.admin.verifyAccess` を呼び出す）
2. レスポンスに応じて画面を出し分け
   - `status: "needsSetup"` → 管理者登録フォームを表示
   - `status: "authorized"` → 管理画面を表示
   - `status: "unauthorized"` → エラー表示（ログインページへのリンクを含む）

### 管理者登録後の処理

1. `/trpc/admin.register` を呼び出す（BFFが `me.subsco.admin.registerAdmin` を呼び出す）
2. 成功後、useQueryを再検証して管理画面を表示

## XRPC API

### me.subsco.admin.verifyAccess

管理画面へのアクセス権を検証し、サーバーの状態とユーザーの権限を返す。

#### 権限

- ログイン済みであれば誰でも呼び出し可能

#### リクエスト

なし

#### レスポンス

| フィールド | 型                                             | 説明         |
| ---------- | ---------------------------------------------- | ------------ |
| status     | "needsSetup" \| "authorized" \| "unauthorized" | アクセス状態 |

- `needsSetup`: 管理者が未登録（初期セットアップが必要）
- `authorized`: 管理画面にアクセス可能
- `unauthorized`: 管理者ではないためアクセス不可

#### エラー

| ステータス | 説明                            |
| ---------- | ------------------------------- |
| 401        | 未ログイン（AuthRequiredError） |

### me.subsco.admin.registerAdmin

初回の管理者を登録する。

#### 権限

- ログイン済みかつ管理者が存在しない場合のみ呼び出し可能

#### リクエスト

なし（ログイン済みユーザーのDIDを自動的に使用）

#### レスポンス

なし

#### エラー

| ステータス | 説明                                       |
| ---------- | ------------------------------------------ |
| 400        | 既に管理者が存在する（AdminAlreadyExists） |
| 401        | 未ログイン（AuthRequiredError）            |
