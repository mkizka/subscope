import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/app/lib/fetch-json";
import type { loader as serverLoader } from "@/app/routes/api.server-info";

type ServerResponse = Awaited<ReturnType<typeof serverLoader>>["data"];

export function useServerInfo() {
  const server = useQuery({
    queryKey: ["server"],
    queryFn: () => fetchJson<ServerResponse>("/api/server-info"),
    throwOnError: true,
  }).data;

  return {
    operator: server?.operator,
    serviceDid: server?.serviceDid,
  };
}
