import { ServerCard } from "@/app/features/server/parts/server-card";
import { useServerInfo } from "@/app/features/server/use-server-info";

export function ServerCardContainer() {
  const { registeredCount, trackedCount } = useServerInfo();
  return (
    <ServerCard registeredCount={registeredCount} trackedCount={trackedCount} />
  );
}
