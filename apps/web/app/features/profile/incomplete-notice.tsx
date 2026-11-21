import { Info } from "lucide-react";

type Props = {
  tracked: boolean;
};

export function IncompleteNotice({ tracked }: Props) {
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
        {tracked
          ? "このアカウントはメンバーではないため、同期を始める1日前より古い投稿は表示されません。"
          : "このアカウントは同期されていないため、引用などで取得した投稿だけを表示しています。フォローすると同期を開始します。"}
      </span>
    </div>
  );
}
