type Notification = {
  uri: string;
  authorName: string;
  reason: string;
  text?: string;
};

type Props = {
  notifications: Notification[];
};

const reasonLabels: Record<string, string> = {
  like: "さんがいいねしました",
  repost: "さんがリポストしました",
  follow: "さんにフォローされました",
};

export function NotificationPanel({ notifications }: Props) {
  return (
    <section className="p-4">
      <h2 className="font-bold">通知</h2>
      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm opacity-60">
          通知はまだありません
        </p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li
              key={notification.uri}
              className="border-b border-base-300 py-2"
            >
              <p>
                {notification.authorName}
                {reasonLabels[notification.reason]}
              </p>
              {notification.text && (
                <p className="text-sm whitespace-pre-wrap">
                  {notification.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
