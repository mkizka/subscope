import { clsx } from "clsx";
import { BellIcon, InfoIcon, LoaderCircle } from "lucide-react";
import { useId } from "react";

import type { PushSettingState } from "@/app/lib/push-setting";

type Props = {
  state: Exclude<PushSettingState, "unavailable">;
  isPending: boolean;
  onToggle: () => void;
};

const blocked = {
  denied: {
    label: "ブロック中",
    help: "ブラウザのサイト設定で、このサイトの通知を許可すると使えます。",
  },
  unsupported: {
    label: "非対応",
    help: "iPhone・iPadでは、このサイトをホーム画面に追加して開くと使えます。",
  },
};

function BlockedNote({ state }: { state: keyof typeof blocked }) {
  const id = useId();
  const anchor = `--${id.replace(/[^\w-]/g, "")}`;
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        style={{ anchorName: anchor }}
        className="
          inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3
          text-label text-muted
          hover:bg-surface-2
        "
      >
        <InfoIcon className="size-4" aria-hidden />
        {blocked[state].label}
      </button>
      <div
        id={id}
        popover="auto"
        className="
          m-0 w-64 rounded-xl border border-line bg-surface p-3 text-label
          text-ink shadow-lg
        "
        style={{
          positionAnchor: anchor,
          positionArea: "bottom span-left",
          positionTryFallbacks: "flip-inline",
        }}
      >
        {blocked[state].help}
      </div>
    </>
  );
}

export function PushSetting({ state, isPending, onToggle }: Props) {
  const isOn = state === "on";
  return (
    <section className="space-y-4 p-4">
      <h2 className="text-caption text-muted">この端末</h2>
      <div className="flex items-center gap-3 px-3">
        <BellIcon className="size-6 shrink-0" aria-hidden />
        <div id="push-setting-label" className="min-w-0 flex-1 text-body">
          プッシュ通知
        </div>
        {state === "denied" || state === "unsupported" ? (
          <BlockedNote state={state} />
        ) : (
          <>
            {isPending && <LoaderCircle className="size-4 animate-spin" />}
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              aria-labelledby="push-setting-label"
              disabled={isPending}
              onClick={onToggle}
              className={clsx(
                `
                  relative h-6 w-11 shrink-0 rounded-full
                  after:absolute after:top-0.75 after:size-4.5
                  after:rounded-full after:bg-surface
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
          </>
        )}
      </div>
    </section>
  );
}
