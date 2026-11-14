import { useState } from "react";

import { usePushSetting } from "@/app/lib/use-push-setting";

import { PushPrompt } from "./push-prompt";

export function PushPromptContainer() {
  const { state, isPending, toggle } = usePushSetting();
  const [requested, setRequested] = useState(false);

  const enabled = requested && state === "on";
  if (state !== "off" && !enabled) return null;
  return (
    <PushPrompt
      enabled={enabled}
      isPending={isPending}
      onEnable={() => {
        setRequested(true);
        toggle();
      }}
    />
  );
}
