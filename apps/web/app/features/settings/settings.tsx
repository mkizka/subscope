import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { Form } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";

type Props = {
  avatarUrl?: string;
  displayName?: string;
  handle?: string;
  accountUrl: string | null;
};

export function Settings({
  avatarUrl,
  displayName,
  handle,
  accountUrl,
}: Props) {
  return (
    <>
      <h1 className="p-4 pb-2 text-title">設定</h1>
      <section className="space-y-4 p-4">
        <h2 className="text-caption text-muted">アカウント</h2>
        <div className="flex items-center gap-3 rounded-xl border border-line p-4">
          <Avatar src={avatarUrl} />
          <div className="min-w-0">
            <div className="truncate text-body font-bold">{displayName}</div>
            <div className="truncate text-label text-muted">@{handle}</div>
          </div>
        </div>
        {accountUrl && (
          <a
            href={accountUrl}
            target="_blank"
            rel="noreferrer"
            className="
              flex items-center justify-between rounded-xl px-3 py-2 text-body
              hover:bg-surface-2
            "
          >
            アカウント管理
            <ExternalLinkIcon
              className="size-4"
              aria-hidden
              data-testid="external-link-icon"
            />
          </a>
        )}
        <Form method="post" action="/oauth/logout">
          <Button type="submit" variant="secondary">
            <LogOutIcon className="size-4" />
            ログアウト
          </Button>
        </Form>
      </section>
    </>
  );
}
