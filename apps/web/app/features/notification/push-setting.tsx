import { Button } from "@/app/components/ui/button";
import type { PushSettingState } from "@/app/lib/push-setting";

type Props = {
  state: Exclude<PushSettingState, "unavailable">;
  isPending: boolean;
  permissionDismissed?: boolean;
  onToggle: () => void;
};

export function PushSetting({
  state,
  isPending,
  permissionDismissed,
  onToggle,
}: Props) {
  const isOn = state === "on";
  return (
    <div
      className="
        flex flex-wrap items-center justify-between gap-3 border-b border-line
        px-4 py-2 text-label
      "
    >
      {state === "denied" ? (
        <p className="text-muted">
          ブラウザで通知がブロックされています。ブラウザの設定から許可してください
        </p>
      ) : state === "unsupported" ? (
        <p className="text-muted">
          このブラウザはプッシュ通知に対応していません。iPhoneとiPadではホーム画面に追加すると使えます
        </p>
      ) : (
        <>
          <p>{isOn ? "プッシュ通知はオンです" : "プッシュ通知はオフです"}</p>
          <Button
            variant="secondary"
            size="sm"
            loading={isPending}
            onClick={onToggle}
          >
            {isOn ? "オフにする" : "オンにする"}
          </Button>
          {permissionDismissed && !isPending && (
            <p className="basis-full text-muted">
              アドレスバーのアイコンから通知を許可してください
            </p>
          )}
        </>
      )}
    </div>
  );
}
