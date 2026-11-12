import { BellIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";

type Props = {
  isPending: boolean;
  onEnable: () => void;
};

export function PushPrompt({ isPending, onEnable }: Props) {
  return (
    <div
      className="
        flex items-center gap-3 border-b border-line bg-brand-soft px-4 py-3
      "
    >
      <BellIcon className="size-6 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-body font-bold">プッシュ通知を受け取る</div>
        <div className="text-caption text-muted">
          この端末に新しい通知を届けます
        </div>
      </div>
      <Button size="sm" loading={isPending} onClick={onEnable}>
        オンにする
      </Button>
    </div>
  );
}
