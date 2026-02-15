import { LoaderCircleIcon, XIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { InfiniteScrollTrigger } from "@/app/features/admin/parts/infinite-scroll-trigger";
import { StatusBadge } from "@/app/features/admin/parts/status-badge";

export type InviteCode = {
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: { did: string; handle?: string };
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type Props = {
  codes: InviteCode[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  onCreateCode: () => void;
  isCreating: boolean;
  onDeleteCode: (code: string) => void;
  deletingCode: string | null;
};

function isDeletable(code: InviteCode) {
  return !code.usedAt;
}

function isExpired(code: InviteCode) {
  return new Date(code.expiresAt) < new Date();
}

export function InviteCodeTable({
  codes,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  hasNextPage,
  onCreateCode,
  isCreating,
  onDeleteCode,
  deletingCode,
}: Props) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">招待コード一覧</CardTitle>
          <Button onClick={onCreateCode} disabled={isCreating}>
            {isCreating ? "作成中..." : "新規作成"}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>コード</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>使用者</TableHead>
                <TableHead>有効期限</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead>削除</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    招待コードはまだありません
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    読み込み中...
                  </TableCell>
                </TableRow>
              )}
              {codes.map((code) => (
                <TableRow key={code.code}>
                  <TableCell className="font-mono">{code.code}</TableCell>
                  <TableCell>
                    <StatusBadge
                      usedAt={code.usedAt}
                      expiresAt={code.expiresAt}
                    />
                  </TableCell>
                  <TableCell>
                    {code.usedBy?.handle ?? code.usedBy?.did ?? "-"}
                  </TableCell>
                  <TableCell>{formatDate(code.expiresAt)}</TableCell>
                  <TableCell>{formatDate(code.createdAt)}</TableCell>
                  <TableCell>
                    {isDeletable(code) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            isExpired(code) ||
                            window.confirm(`${code.code} を削除しますか？`)
                          ) {
                            onDeleteCode(code.code);
                          }
                        }}
                        disabled={deletingCode === code.code}
                      >
                        {deletingCode === code.code ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : (
                          <XIcon className="text-destructive" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {isFetchingNextPage && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          読み込み中...
        </p>
      )}
      {onLoadMore && (
        <InfiniteScrollTrigger
          onIntersect={onLoadMore}
          enabled={hasNextPage && !isFetchingNextPage}
        />
      )}
    </>
  );
}
