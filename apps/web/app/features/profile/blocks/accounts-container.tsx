import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useRef } from "react";
import { useSearchParams } from "react-router";

import { LoadingSpinner } from "@/app/components/loading-spinner";
import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";
import { Tabs } from "@/app/components/ui/tabs";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader as registeredLoader } from "@/app/routes/api.registered-accounts";
import type { loader as trackedLoader } from "@/app/routes/api.tracked-accounts";

import { type Account, AccountList } from "./account-list";

type RegisteredResponse = Awaited<ReturnType<typeof registeredLoader>>["data"];
type TrackedResponse = Awaited<ReturnType<typeof trackedLoader>>["data"];

export function AccountsContainer() {
  const [params] = useSearchParams();
  const tracked = params.get("tab") === "tracked";
  const helpRef = useRef<HTMLDialogElement>(null);

  const registeredQuery = useQuery({
    queryKey: ["clientRegisteredAccounts"],
    queryFn: () => fetchJson<RegisteredResponse>("/api/registered-accounts"),
    throwOnError: true,
  });
  const trackedQuery = useQuery({
    queryKey: ["trackedAccounts"],
    queryFn: () => fetchJson<TrackedResponse>("/api/tracked-accounts"),
    throwOnError: true,
  });
  const registered = registeredQuery.data;
  const trackedData = trackedQuery.data;

  const accounts: Account[] | undefined = tracked
    ? trackedData?.accounts
    : registered?.registeredAccounts;

  return (
    <>
      <h1 className="border-b border-line p-4 text-title">アカウント</h1>
      <Tabs
        tabs={[
          {
            to: "/accounts",
            label: `登録アカウント${registered ? ` ${registered.registeredAccounts.length}${registered.hasMore ? "+" : ""}` : ""}`,
            selected: !tracked,
          },
          {
            to: "/accounts?tab=tracked",
            label: `追跡アカウント${trackedData ? ` ${trackedData.total}` : ""}`,
            selected: tracked,
          },
        ]}
      />
      {tracked && (
        <>
          <button
            type="button"
            onClick={() => helpRef.current?.showModal()}
            className="
              flex items-center gap-1 px-4 py-2 text-label text-muted
              hover:underline
            "
          >
            <InfoIcon className="size-4" aria-hidden />
            追跡アカウントとは？
          </button>
          <Dialog
            ref={helpRef}
            title="追跡アカウント"
            actions={
              <Button
                type="button"
                variant="secondary"
                onClick={() => helpRef.current?.close()}
              >
                閉じる
              </Button>
            }
          >
            <p>
              登録アカウントと、登録アカウント1人以上からフォローされているアカウントです。これらのアカウントの投稿がサーバーに保存されます。
            </p>
          </Dialog>
        </>
      )}
      {accounts ? (
        <AccountList accounts={accounts} />
      ) : (
        <LoadingSpinner label="読み込み中" />
      )}
    </>
  );
}
