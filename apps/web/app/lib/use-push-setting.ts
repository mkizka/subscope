import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { disablePush, enablePush, fetchPushSettingState } from "./push-setting";

export function usePushSetting() {
  const queryClient = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ["pushSetting"],
    queryFn: fetchPushSettingState,
  });
  const toggle = useMutation({
    mutationFn: async () => {
      await (state === "on" ? disablePush() : enablePush());
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["pushSetting"] }),
  });
  return {
    state,
    isPending: toggle.isPending,
    toggle: () => toggle.mutate(),
  };
}
