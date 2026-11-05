import { useServerInfo } from "@/app/features/server/use-server-info";

import { ServerInfo } from "./server-info";

export function ServerInfoContainer() {
  return <ServerInfo {...useServerInfo()} />;
}
