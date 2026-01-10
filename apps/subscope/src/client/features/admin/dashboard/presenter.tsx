import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/card";
import { KeyIcon } from "../../../components/icons";

export type DashboardStats = {
  totalUsers: number;
  unusedInviteCodes: number;
  todayNewUsers: number;
};

type DashboardPresenterProps = {
  stats: DashboardStats;
};

export function DashboardPresenter({ stats }: DashboardPresenterProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              総ユーザー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-on-surface">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              未使用招待コード
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-on-surface">
              {stats.unusedInviteCodes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              今日の新規登録
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-on-surface">
              {stats.todayNewUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>よく使う機能にすばやくアクセス</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="/admin/invite-codes"
            className="flex w-full items-center justify-start gap-3 h-10 px-4 rounded-full border-2 border-outline bg-transparent text-primary hover:bg-primary-container transition-all duration-200 ease-out no-underline"
          >
            <KeyIcon className="h-4 w-4" />
            新しい招待コードを発行
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
