import { useMe } from "@/app/features/navigation/side-nav-container";

import { Settings } from "./settings";

export function SettingsContainer({
  accountUrl,
}: {
  accountUrl: string | null;
}) {
  const me = useMe();

  return (
    <Settings
      avatarUrl={me?.avatarUrl}
      displayName={me?.displayName}
      handle={me?.handle}
      accountUrl={accountUrl}
    />
  );
}
