import { usePushSetting } from "@/app/lib/use-push-setting";

import { PushSetting } from "./push-setting";

export function PushSettingContainer() {
  const { state, isPending, permissionDismissed, toggle } = usePushSetting();

  if (!state || state === "unavailable") return null;
  return (
    <PushSetting
      state={state}
      isPending={isPending}
      permissionDismissed={permissionDismissed}
      onToggle={toggle}
    />
  );
}
