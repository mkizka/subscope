import { Link } from "react-router";

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
import { StatusBadge } from "@/app/features/admin/parts/status-badge";

type InviteCode = {
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: { did: string; handle?: string };
};

type Props = {
  codes: InviteCode[];
  nextCursor?: string;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function InviteCodeTable({ codes, nextCursor }: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">招待コード一覧</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    招待コードはまだありません
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link to={`/admin?cursor=${encodeURIComponent(nextCursor)}`} />
            }
          >
            次のページ
          </Button>
        </div>
      )}
    </>
  );
}
