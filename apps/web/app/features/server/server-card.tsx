import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

export function ServerCard() {
  return (
    <Link
      to="/server"
      className="
        block rounded-2xl border border-line bg-surface-2 p-4
        hover:opacity-90
      "
    >
      <div className="flex items-center justify-between">
        <span className="text-heading">サーバーについて</span>
        <ChevronRightIcon className="size-4 text-muted" aria-hidden />
      </div>
      <p className="mt-2 text-label text-muted">
        SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。
      </p>
    </Link>
  );
}
