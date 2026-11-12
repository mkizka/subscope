import { clsx } from "clsx";
import { BellIcon, InfoIcon, LoaderCircle } from "lucide-react";

import type { PushSettingState } from "@/app/lib/push-setting";

type Props = {
  state: Exclude<PushSettingState, "unavailable">;
  isPending: boolean;
  permissionDismissed?: boolean;
  onToggle: () => void;
};

const description = ({
  state,
  permissionDismissed,
}: Pick<Props, "state" | "permissionDismissed">) => {
  if (state === "denied") {
    return "ブラウザで通知がブロックされています。サイト設定から許可すると使えます";
  }
  if (state === "unsupported") {
    return "このブラウザでは使えません。iPhone・iPadはホーム画面に追加すると使えます";
  }
  if (permissionDismissed) {
    return "許可されませんでした。もう一度押すか、ブラウザのサイト設定から許可してください";
  }
  return null;
};

export function PushSetting({
  state,
  isPending,
  permissionDismissed,
  onToggle,
}: Props) {
  const isOn = state === "on";
  const note = description({
    state,
    permissionDismissed: permissionDismissed && !isPending,
  });
  const unavailable = state === "denied" || state === "unsupported";
  return (
    <section className="space-y-4 p-4">
      <h2 className="text-caption text-muted">この端末</h2>
      <div className="flex items-center gap-3 px-3">
        <BellIcon className="size-6 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div id="push-setting-label" className="text-body">
            プッシュ通知
          </div>
          {note && (
            <div className="flex items-start gap-1 text-caption text-muted">
              <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {note}
            </div>
          )}
        </div>
        {isPending && <LoaderCircle className="size-4 animate-spin" />}
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-labelledby="push-setting-label"
          disabled={unavailable || isPending}
          onClick={onToggle}
          className={clsx(
            `
              relative h-6 w-11 shrink-0 rounded-full
              after:absolute after:top-0.75 after:size-4.5 after:rounded-full
              after:bg-surface
              disabled:cursor-not-allowed disabled:opacity-50
            `,
            isOn
              ? `
                bg-brand
                after:left-5.75
              `
              : `
                bg-line
                after:left-0.75
              `,
          )}
        />
      </div>
    </section>
  );
}
