import { HomeIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ErrorIcon } from "@/app/features/error/parts/error-icon";

type Props = {
  title: string;
  details: string;
  status?: number;
  stack?: string;
};

export function ErrorCard({ title, details, status, stack }: Props) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ErrorIcon status={status} />
          <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {details}
          {status && `（ステータス：${status}）`}
        </p>
        {stack && (
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-muted p-4 text-xs">
            <code>{stack}</code>
          </pre>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" render={<a href="/" />}>
          <HomeIcon />
          ホームに戻る
        </Button>
      </CardFooter>
    </Card>
  );
}
