import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/app/components/loading-spinner";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.registered-accounts";

import { ActorList } from "./actor-list";

type RegisteredAccountsResponse = Awaited<ReturnType<typeof loader>>["data"];

export function RegisteredAccountsContainer() {
  const { data } = useQuery({
    queryKey: ["clientRegisteredAccounts"],
    queryFn: () =>
      fetchJson<RegisteredAccountsResponse>("/api/registered-accounts"),
    throwOnError: true,
  });

  return (
    <>
      <h1 className="border-b border-line p-4 text-title">
        登録アカウント{" "}
        {data && (
          <span className="font-normal text-muted">
            {data.registeredAccounts.length}人{data.hasMore && "以上"}
          </span>
        )}
      </h1>
      {data ? (
        <ActorList actors={data.registeredAccounts} />
      ) : (
        <LoadingSpinner label="読み込み中" />
      )}
    </>
  );
}
