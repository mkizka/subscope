import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/app/lib/fetch-json";
import type { loader as registeredLoader } from "@/app/routes/api.registered-accounts";
import type { loader as serverLoader } from "@/app/routes/api.server-info";
import type { loader as trackedLoader } from "@/app/routes/api.tracked-accounts";

type RegisteredResponse = Awaited<ReturnType<typeof registeredLoader>>["data"];
type TrackedResponse = Awaited<ReturnType<typeof trackedLoader>>["data"];
type ServerResponse = Awaited<ReturnType<typeof serverLoader>>["data"];

export function useServerInfo() {
  const registered = useQuery({
    queryKey: ["clientRegisteredAccounts", ""],
    queryFn: () => fetchJson<RegisteredResponse>(`/api/registered-accounts?q=`),
    throwOnError: true,
  }).data;
  const tracked = useQuery({
    queryKey: ["trackedAccounts", ""],
    queryFn: () => fetchJson<TrackedResponse>(`/api/tracked-accounts?q=`),
    throwOnError: true,
  }).data;
  const server = useQuery({
    queryKey: ["server"],
    queryFn: () => fetchJson<ServerResponse>("/api/server-info"),
    throwOnError: true,
  }).data;

  return {
    registeredCount: registered
      ? `${registered.registeredAccounts.length}${registered.hasMore ? "+" : ""}`
      : undefined,
    trackedCount: tracked?.total,
    serviceDid: server?.serviceDid,
  };
}
