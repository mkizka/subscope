import { BellIcon } from "lucide-react";
import { Link } from "react-router";

type Props = {
  unreadCount: number;
};

export function NotificationBell({ unreadCount }: Props) {
  return (
    <Link
      to="/notifications"
      aria-label="通知を開く"
      className="btn indicator btn-square btn-ghost"
    >
      {unreadCount > 0 && (
        <span className="indicator-item badge badge-sm badge-primary">
          {unreadCount}
        </span>
      )}
      <BellIcon />
    </Link>
  );
}
