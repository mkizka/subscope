import { Info } from "lucide-react";

export function IncompleteNotice() {
  return (
    <div
      role="status"
      className="
        flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2
        text-label text-muted
      "
    >
      <Info className="size-4 shrink-0" />
      <span>
        このアカウントは一部のデータだけを保存しているため、投稿などが表示されないことがあります。
      </span>
    </div>
  );
}
