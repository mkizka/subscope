import { ServerInfo } from "./server-info";
import { useServerInfo } from "./use-server-info";

export function ServerInfoContainer() {
  return <ServerInfo {...useServerInfo()} />;
}
