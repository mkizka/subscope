import { BellIcon, CheckIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";

type Props = {
  enabled: boolean;
  isPending: boolean;
  onEnable: () => void;
};

export function PushPrompt({ enabled, isPending, onEnable }: Props) {
  const Icon = enabled ? CheckIcon : BellIcon;
  return (
    <div
      role="status"
      className="
        flex items-center gap-3 border-b border-line bg-brand-soft px-4 py-3
      "
    >
      <Icon className="size-6 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 flex-1 text-body font-bold">
        {enabled ? "プッシュ通知をオンにしました" : "プッシュ通知を受け取る"}
      </div>
      {!enabled && (
        <Button size="sm" loading={isPending} onClick={onEnable}>
          オンにする
        </Button>
      )}
    </div>
  );
}
