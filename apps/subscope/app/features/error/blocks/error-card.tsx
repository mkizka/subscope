import { CheckIcon, CopyIcon, HomeIcon } from "lucide-react";
import { useState } from "react";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!stack) return;
    void navigator.clipboard.writeText(stack).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          <div className="relative mt-4">
            <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-xs">
              <code>{stack}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-muted-foreground"
              onClick={handleCopy}
              aria-label="スタックトレースをコピー"
            >
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </Button>
          </div>
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
