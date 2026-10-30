import { Link } from "react-router";

type Props = {
  did?: string;
  avatarUrl?: string;
  handle?: string;
  isAdmin?: boolean;
};

export function SideNav({ did, avatarUrl, handle, isAdmin }: Props) {
  const profileId = handle === "handle.invalid" ? did : handle;

  return (
    <nav className="flex h-full flex-col">
      <div className="p-4 text-lg font-bold text-primary">Subscope</div>
      <ul className="menu w-full flex-1">
        <li>
          <h2 className="menu-title">タイムライン</h2>
          <ul>
            <li>
              <a className="menu-active">フォロー中</a>
            </li>
          </ul>
        </li>
        {isAdmin && (
          <li>
            <h2 className="menu-title">サーバー</h2>
            <ul>
              <li>
                <Link to="/admin/subscribers">登録ユーザー</Link>
              </li>
              <li>
                <Link to="/admin/invite-codes">招待コード</Link>
              </li>
              <li>
                <Link to="/admin/bull-board" reloadDocument>
                  ジョブキュー
                </Link>
              </li>
            </ul>
          </li>
        )}
        <li>
          <Link to="/tracked-actors">追跡中のユーザー</Link>
        </li>
        <li>
          {profileId ? (
            <Link to={`/profile/${profileId}`}>プロフィール</Link>
          ) : (
            <a>プロフィール</a>
          )}
        </li>
      </ul>
      <div className="flex items-center gap-2 border-t border-base-300 p-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="size-8 rounded-full bg-base-300" />
        )}
        {handle && <span className="truncate text-sm">@{handle}</span>}
      </div>
    </nav>
  );
}
