import { Info } from "lucide-react";

export function UntrackedNotice() {
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
        このアカウントのデータはサーバーに同期されていません。フォローすると同期を開始します。
      </span>
    </div>
  );
}
