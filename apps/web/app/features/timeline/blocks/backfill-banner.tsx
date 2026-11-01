import { clsx } from "clsx";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

export type BackfillBannerStatus = "inProgress" | "error" | "done";

type Props = {
  status: BackfillBannerStatus;
  onRefresh: () => void;
};

const ICONS = {
  inProgress: <LoaderCircle className="size-4 shrink-0 animate-spin" />,
  error: <TriangleAlert className="size-4 shrink-0" />,
  done: <Check className="size-4 shrink-0" />,
};

const MESSAGES = {
  inProgress:
    "過去の投稿を取り込んでいます。終わるまで一部の投稿が表示されません",
  error:
    "一部のユーザーの過去の投稿を取り込めていません。自動で再試行しています",
  done: "過去の投稿の取り込みが終わりました",
};

export function BackfillBanner({ status, onRefresh }: Props) {
  return (
    <div
      role="status"
      className={clsx(
        `
          flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2
          text-label
        `,
        status === "error" ? "text-danger" : "text-muted",
      )}
    >
      {ICONS[status]}
      <span>{MESSAGES[status]}</span>
      {status === "done" && (
        <button
          type="button"
          className="
            ml-auto shrink-0 text-brand
            hover:underline
          "
          onClick={onRefresh}
        >
          更新する
        </button>
      )}
    </div>
  );
}
