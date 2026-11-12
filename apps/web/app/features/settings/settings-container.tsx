import { useSubmit } from "react-router";

import { useMe } from "@/app/features/navigation/side-nav-container";
import { disablePush } from "@/app/lib/push-setting";

import { PushSettingContainer } from "./push-setting-container";
import { Settings } from "./settings";

export function SettingsContainer({
  accountUrl,
}: {
  accountUrl: string | null;
}) {
  const me = useMe();
  const submit = useSubmit();

  const logout = async () => {
    // ログアウトした人の通知がこの端末に届き続けないよう、ログアウトの前に購読を解除する
    await disablePush().catch(() => {});
    await submit(null, { method: "post", action: "/oauth/logout" });
  };

  return (
    <Settings
      avatarUrl={me?.avatarUrl}
      displayName={me?.displayName}
      handle={me?.handle}
      accountUrl={accountUrl}
      pushSetting={<PushSettingContainer />}
      onLogout={() => void logout()}
    />
  );
}
