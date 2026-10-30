import { isRouteErrorResponse } from "react-router";

import { ErrorCard } from "@/app/features/error/blocks/error-card";

type Props = {
  error: unknown;
};

export function ErrorPage({ error }: Props) {
  let title = "エラーが発生しました";
  let details = "予期しないエラーが発生しました。";
  let stack: string | undefined;
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;

    if (error.status === 404) {
      title = "ページが見つかりません";
      details = "お探しのページは存在しないか、移動した可能性があります。";
    } else {
      title = "ページを表示できませんでした";
      details = typeof error.data === "string" ? error.data : error.statusText;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <ErrorCard
          title={title}
          details={details}
          status={status}
          stack={stack}
        />
      </div>
    </main>
  );
}
