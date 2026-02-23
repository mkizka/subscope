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

export type Subscriber = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

type Props = {
  subscribers: Subscriber[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
};

export function SubscriberTable({
  subscribers,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  hasNextPage,
}: Props) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">
            登録アカウント一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>DID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && subscribers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center">
                    登録アカウントはまだありません
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center">
                    読み込み中...
                  </TableCell>
                </TableRow>
              )}
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.did}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {subscriber.avatar ? (
                        <img
                          src={subscriber.avatar}
                          alt=""
                          className="size-8 rounded-full"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted" />
                      )}
                      <div className="flex flex-col">
                        {subscriber.displayName && (
                          <span className="text-sm font-medium">
                            {subscriber.displayName}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          @{subscriber.handle}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {subscriber.did}
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
