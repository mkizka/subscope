import { BellIcon } from "lucide-react";

type Props = {
  unreadCount: number;
};

export function NotificationBell({ unreadCount }: Props) {
  return (
    <label
      htmlFor="notification-toggle"
      aria-label="通知を開く"
      className="btn indicator btn-square btn-ghost"
    >
      {unreadCount > 0 && (
        <span className="indicator-item badge badge-sm badge-primary">
          {unreadCount}
        </span>
      )}
      <BellIcon />
    </label>
  );
}
