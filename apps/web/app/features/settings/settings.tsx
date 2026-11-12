import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Form } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";

type Props = {
  avatarUrl?: string;
  displayName?: string;
  handle?: string;
  accountUrl: string | null;
  pushSetting: ReactNode;
  onLogout: () => void;
};

export function Settings({
  avatarUrl,
  displayName,
  handle,
  accountUrl,
  pushSetting,
  onLogout,
}: Props) {
  return (
    <>
      <h1 className="p-4 pb-2 text-title">設定</h1>
      <section className="p-4">
        <div className="flex items-center gap-3 px-3">
          <Avatar src={avatarUrl} />
          <div className="min-w-0">
            <div className="truncate text-body font-bold">{displayName}</div>
            <div className="truncate text-label text-muted">@{handle}</div>
          </div>
        </div>
      </section>
      <section className="space-y-4 p-4">
        <h2 className="text-label font-bold">アカウント</h2>
        {accountUrl && (
          <a
            href={accountUrl}
            target="_blank"
            rel="noreferrer"
            className="
              flex items-center justify-between rounded-xl px-3 py-2
              hover:bg-surface-2
            "
          >
            <div className="min-w-0">
              <div className="text-body">アカウント設定</div>
              <div className="truncate text-caption text-muted">
                {new URL(accountUrl).host} で設定できます
              </div>
            </div>
            <ExternalLinkIcon
              className="size-4 shrink-0"
              aria-hidden
              data-testid="external-link-icon"
            />
          </a>
        )}
      </section>
      {pushSetting}
      <section className="p-4">
        <Form
          method="post"
          action="/oauth/logout"
          onSubmit={(event) => {
            event.preventDefault();
            onLogout();
          }}
        >
          <Button type="submit" variant="secondary">
            <LogOutIcon className="size-4" />
            ログアウト
          </Button>
        </Form>
      </section>
    </>
  );
}
