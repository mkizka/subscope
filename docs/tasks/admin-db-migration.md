# 管理者のDB保存への変更

## 概要

現在の`ADMIN_DID`環境変数による管理者チェックを、DBに管理者を保存する方式に変更する。

### 要件

- 複数管理者対応（DBテーブルで管理）
- 初期管理者登録フロー: 管理者0人の状態でアクセス → ログイン → 最初の管理者として登録
- 二人目以降の管理者登録UIは今回対象外
- `ADMIN_DID`環境変数は削除

### アーキテクチャ

```
[Admin App] → (XRPC) → [AppView] → [adminsテーブル]
```

---

## Phase 1: DBスキーマとドメインモデル

### 作業内容

1. **DBスキーマ追加**
   - 編集: `packages/db/src/schema.ts`
   - `admins`テーブルを追加

   ```typescript
   export const admins = pgTable("admins", {
     did: varchar({ length: 256 }).primaryKey(),
     createdAt: timestamp().defaultNow().notNull(),
   });
   ```

2. **マイグレーション生成**

   ```bash
   pnpm db:generate
   ```

3. **ドメインモデル作成**
   - 新規: `packages/common/src/lib/domain/admin/admin.ts`

   ```typescript
   import { asDid, type Did } from "@atproto/did";

   export class Admin {
     readonly did: Did;
     readonly createdAt: Date;

     constructor(params: { did: string; createdAt: Date }) {
       this.did = asDid(params.did);
       this.createdAt = params.createdAt;
     }

     static create(did: string): Admin {
       return new Admin({
         did,
         createdAt: new Date(),
       });
     }
   }
   ```

4. **テスト用ファクトリ作成**
   - 新規: `packages/common/src/lib/domain/admin/admin.factory.ts`
   - 参考: `packages/common/src/lib/domain/actor/actor.factory.ts`

5. **エクスポート追加**
   - 編集: `packages/common/src/domain.ts` に `./lib/domain/admin/admin.js` を追加
   - 編集: `packages/common/src/test.ts` に `./lib/domain/admin/admin.factory.js` を追加

### 完了条件

```bash
pnpm all:unit --filter @repo/db
pnpm all:unit --filter @repo/common
```

---

## Phase 2: リポジトリ実装

### 作業内容

1. **インターフェース定義**
   - 新規: `apps/appview/src/application/interfaces/admin-repository.ts`

   ```typescript
   import type { Admin } from "@repo/common/domain";

   export interface IAdminRepository {
     create(admin: Admin): Promise<void>;
     findByDid(did: string): Promise<Admin | null>;
     exists(): Promise<boolean>;
   }
   ```

2. **リポジトリ実装**
   - 新規: `apps/appview/src/infrastructure/admin-repository/admin-repository.ts`
   - 参考: `apps/appview/src/infrastructure/invite-code-repository/invite-code-repository.ts`

3. **InMemory実装（テスト用）**
   - 新規: `apps/appview/src/infrastructure/admin-repository/admin-repository.in-memory.ts`

4. **テスト作成**
   - 新規: `apps/appview/src/infrastructure/admin-repository/admin-repository.test.ts`
   - テストケース:
     - 「管理者を作成する場合、DBに保存される」
     - 「存在しないDIDを検索する場合、nullを返す」
     - 「管理者が0人の場合、existsはfalseを返す」
     - 「管理者が存在する場合、existsはtrueを返す」

### 完了条件

```bash
pnpm all:unit --filter @repo/appview admin-repository
```

---

## Phase 3: Lexicon追加とユースケース

### 作業内容

1. **Lexicon追加**
   - 新規: `packages/client/lexicons/me/subsco/admin/getAdminStatus.json`
     ```json
     {
       "lexicon": 1,
       "id": "me.subsco.admin.getAdminStatus",
       "defs": {
         "main": {
           "type": "query",
           "description": "Get admin status for the current user",
           "output": {
             "encoding": "application/json",
             "schema": {
               "type": "object",
               "required": ["hasAdmins", "isAdmin"],
               "properties": {
                 "hasAdmins": { "type": "boolean" },
                 "isAdmin": { "type": "boolean" }
               }
             }
           }
         }
       }
     }
     ```
   - 新規: `packages/client/lexicons/me/subsco/admin/registerFirstAdmin.json`
     ```json
     {
       "lexicon": 1,
       "id": "me.subsco.admin.registerFirstAdmin",
       "defs": {
         "main": {
           "type": "procedure",
           "description": "Register the first admin when no admins exist",
           "input": {
             "encoding": "application/json",
             "schema": { "type": "object", "properties": {} }
           },
           "output": {
             "encoding": "application/json",
             "schema": {
               "type": "object",
               "required": ["success"],
               "properties": { "success": { "type": "boolean" } }
             }
           },
           "errors": [{ "name": "AdminAlreadyExists" }]
         }
       }
     }
     ```

2. **クライアント再生成**

   ```bash
   pnpm install
   ```

3. **ユースケース実装**
   - 新規: `apps/appview/src/application/use-cases/admin/get-admin-status-use-case.ts`
   - 新規: `apps/appview/src/application/use-cases/admin/register-first-admin-use-case.ts`
     - 管理者が既に存在する場合はエラーを返す

4. **テスト作成**
   - 新規: `apps/appview/src/application/use-cases/admin/get-admin-status-use-case.test.ts`
     - 「管理者が0人の場合、hasAdmins=false、isAdmin=falseを返す」
     - 「管理者が存在し、リクエスト者が管理者の場合、hasAdmins=true、isAdmin=trueを返す」
     - 「管理者が存在し、リクエスト者が管理者でない場合、hasAdmins=true、isAdmin=falseを返す」
   - 新規: `apps/appview/src/application/use-cases/admin/register-first-admin-use-case.test.ts`
     - 「管理者が0人の場合、最初の管理者として登録できる」
     - 「既に管理者が存在する場合、エラーを返す」

### 参考ファイル

- `apps/appview/src/application/use-cases/admin/create-invite-code-use-case.ts`
- `packages/client/lexicons/me/subsco/admin/createInviteCode.json`

### 完了条件

```bash
pnpm all:unit --filter @repo/appview admin-status
pnpm all:unit --filter @repo/appview register-first-admin
```

---

## Phase 4: XRPCエンドポイントとミドルウェア変更

### 作業内容

1. **XRPCエンドポイント実装**
   - 新規: `apps/appview/src/presentation/routes/me/subsco/admin/getAdminStatus.ts`
   - 新規: `apps/appview/src/presentation/routes/me/subsco/admin/registerFirstAdmin.ts`
   - 参考: `apps/appview/src/presentation/routes/me/subsco/admin/createInviteCode.ts`

2. **AdminMiddleware変更**
   - 編集: `apps/appview/src/presentation/middleware/admin-middleware.ts`

   ```typescript
   export class AdminMiddleware {
     constructor(
       private readonly authVerifier: AuthVerifierMiddleware,
       private readonly adminRepository: IAdminRepository,
     ) {}
     static inject = ["authVerifierMiddleware", "adminRepository"] as const;

     async requireAdmin(request: MaybeRequest) {
       const authResult = await this.authVerifier.loginRequired(request);
       const admin = await this.adminRepository.findByDid(
         authResult.credentials.did,
       );
       if (!admin) {
         throw new AuthRequiredError("Admin access required");
       }
       return authResult;
     }
   }
   ```

3. **DIコンテナ登録**
   - 編集: `apps/appview/src/appview.ts`
   - 追加:
     - `adminRepository`
     - `getAdminStatusUseCase`
     - `registerFirstAdminUseCase`
     - `getAdminStatus`
     - `registerFirstAdmin`

4. **テスト作成**
   - 新規: `apps/appview/src/presentation/middleware/admin-middleware.test.ts`
     - 「管理者として登録されたDIDの場合、認証が成功する」
     - 「管理者として登録されていないDIDの場合、AuthRequiredErrorをスローする」

### 完了条件

```bash
pnpm all --filter @repo/appview
```

---

## Phase 5: Admin Appフロントエンド

### 作業内容

1. **トップページ変更**
   - 編集: `apps/admin/app/routes/_index.tsx`
   - ログイン後に`getAdminStatus` APIを呼び出し
   - `hasAdmins=false` → `/setup`にリダイレクト
   - `isAdmin=false` → `/access-denied`にリダイレクト

2. **初期セットアップページ作成**
   - 新規: `apps/admin/app/routes/setup.tsx`
   - 「あなた（{DID}）を最初の管理者として登録しますか？」確認画面
   - 「登録する」ボタンで`registerFirstAdmin`を呼び出し
   - 登録成功後、トップページにリダイレクト
   - 参考: `apps/admin/app/routes/_index.tsx`

3. **アクセス拒否ページ作成**
   - 新規: `apps/admin/app/routes/access-denied.tsx`
   - 「このアカウントは管理者ではありません」表示
   - ログアウトボタン

### 完了条件

```bash
pnpm all --filter @repo/admin
```

手動テスト:

- 管理者0人の状態でアクセス → ログイン → /setup表示 → 登録 → 管理画面表示
- 管理者登録済み＋非管理者でアクセス → /access-denied表示

---

## Phase 6: 環境変数削除とドキュメント更新

### 作業内容

1. **環境変数定義削除**
   - 編集: `apps/appview/src/shared/env.ts`
   - `ADMIN_DID`の定義を削除

2. **ドキュメント更新**
   - 編集: `docs/user/deploy.md`
   - `ADMIN_DID`の説明を削除

### 完了条件

```bash
pnpm all
```

ドキュメントから`ADMIN_DID`の記載がなくなっていることを確認

---

## マイグレーション戦略（本番環境向け）

本番環境に既存の管理者がいる場合:

1. Phase 1完了後、DBマイグレーションを実行（adminsテーブル作成）
2. 既存の`ADMIN_DID`をadminsテーブルに手動で挿入
   ```sql
   INSERT INTO admins (did, created_at) VALUES ('did:plc:xxx', NOW());
   ```
3. Phase 5まで完了後、新しいコードをデプロイ
4. Phase 6で`ADMIN_DID`環境変数を削除

---

## 修正対象ファイル一覧

| ファイル                                                                             | 操作 | フェーズ |
| ------------------------------------------------------------------------------------ | ---- | -------- |
| `packages/db/src/schema.ts`                                                          | 編集 | 1        |
| `packages/common/src/lib/domain/admin/admin.ts`                                      | 新規 | 1        |
| `packages/common/src/lib/domain/admin/admin.factory.ts`                              | 新規 | 1        |
| `packages/common/src/domain.ts`                                                      | 編集 | 1        |
| `packages/common/src/test.ts`                                                        | 編集 | 1        |
| `apps/appview/src/application/interfaces/admin-repository.ts`                        | 新規 | 2        |
| `apps/appview/src/infrastructure/admin-repository/admin-repository.ts`               | 新規 | 2        |
| `apps/appview/src/infrastructure/admin-repository/admin-repository.in-memory.ts`     | 新規 | 2        |
| `apps/appview/src/infrastructure/admin-repository/admin-repository.test.ts`          | 新規 | 2        |
| `packages/client/lexicons/me/subsco/admin/getAdminStatus.json`                       | 新規 | 3        |
| `packages/client/lexicons/me/subsco/admin/registerFirstAdmin.json`                   | 新規 | 3        |
| `apps/appview/src/application/use-cases/admin/get-admin-status-use-case.ts`          | 新規 | 3        |
| `apps/appview/src/application/use-cases/admin/get-admin-status-use-case.test.ts`     | 新規 | 3        |
| `apps/appview/src/application/use-cases/admin/register-first-admin-use-case.ts`      | 新規 | 3        |
| `apps/appview/src/application/use-cases/admin/register-first-admin-use-case.test.ts` | 新規 | 3        |
| `apps/appview/src/presentation/routes/me/subsco/admin/getAdminStatus.ts`             | 新規 | 4        |
| `apps/appview/src/presentation/routes/me/subsco/admin/registerFirstAdmin.ts`         | 新規 | 4        |
| `apps/appview/src/presentation/middleware/admin-middleware.ts`                       | 編集 | 4        |
| `apps/appview/src/presentation/middleware/admin-middleware.test.ts`                  | 新規 | 4        |
| `apps/appview/src/appview.ts`                                                        | 編集 | 4        |
| `apps/admin/app/routes/_index.tsx`                                                   | 編集 | 5        |
| `apps/admin/app/routes/setup.tsx`                                                    | 新規 | 5        |
| `apps/admin/app/routes/access-denied.tsx`                                            | 新規 | 5        |
| `apps/appview/src/shared/env.ts`                                                     | 編集 | 6        |
| `docs/user/deploy.md`                                                                | 編集 | 6        |
