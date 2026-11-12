import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  disablePush,
  enablePush,
  fetchPushSettingState,
} from "@/app/lib/push-setting";

import { PushSetting } from "./push-setting";

export function PushSettingContainer() {
  const queryClient = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ["pushSetting"],
    queryFn: fetchPushSettingState,
  });
  const toggle = useMutation({
    mutationFn: async () => {
      if (state === "on") {
        await disablePush();
        return null;
      }
      return enablePush();
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["pushSetting"] }),
  });

  if (!state || state === "unavailable") return null;
  return (
    <PushSetting
      state={state}
      isPending={toggle.isPending}
      permissionDismissed={toggle.data === "default"}
      onToggle={() => toggle.mutate()}
    />
  );
}
