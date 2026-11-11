import { Button } from "@/app/components/ui/button";
import type { PushSettingState } from "@/app/lib/push-setting";

type Props = {
  state: Exclude<PushSettingState, "unavailable">;
  isPending: boolean;
  onToggle: () => void;
};

export function PushSetting({ state, isPending, onToggle }: Props) {
  const isOn = state === "on";
  return (
    <div
      className="
        flex items-center justify-between gap-3 border-b border-line px-4 py-2
        text-label
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
        </>
      )}
    </div>
  );
}
