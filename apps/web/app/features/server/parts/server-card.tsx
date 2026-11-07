import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

export function ServerCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/server"
      onClick={onNavigate}
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
        Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです
      </p>
    </Link>
  );
}
