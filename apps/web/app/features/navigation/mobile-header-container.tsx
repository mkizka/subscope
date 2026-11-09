import { MobileHeader } from "./mobile-header";
import { useMe } from "./side-nav-container";

export function MobileHeaderContainer() {
  const me = useMe();

  return (
    <MobileHeader
      avatarUrl={me?.avatarUrl}
      profileId={me?.profileId}
      isAdmin={me?.isAdmin}
    />
  );
}
