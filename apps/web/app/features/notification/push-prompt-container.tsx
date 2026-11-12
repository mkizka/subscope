import { usePushSetting } from "@/app/lib/use-push-setting";

import { PushPrompt } from "./push-prompt";

export function PushPromptContainer() {
  const { state, isPending, toggle } = usePushSetting();

  if (state !== "off") return null;
  return <PushPrompt isPending={isPending} onEnable={toggle} />;
}
