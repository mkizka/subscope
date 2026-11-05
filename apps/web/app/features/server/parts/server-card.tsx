import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

type Props = {
  registeredCount?: string;
  trackedCount?: number;
};

export function ServerCard({ registeredCount, trackedCount }: Props) {
  return (
    <Link
      to="/server"
      className="
        flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3
        hover:opacity-90
      "
    >
      <img src="/favicon.svg" alt="" className="size-9" />
      <div className="min-w-0 flex-1">
        <div className="text-heading">Subscope</div>
        <div className="text-caption text-muted">
          登録 {registeredCount ?? "-"} ・ 追跡 {trackedCount ?? "-"}
        </div>
      </div>
      <ChevronRightIcon className="size-4 text-muted" aria-hidden />
    </Link>
  );
}
