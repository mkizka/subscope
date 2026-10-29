import { Link } from "react-router";

type Props = {
  did?: string;
  avatarUrl?: string;
  handle?: string;
};

export function SideNav({ did, avatarUrl, handle }: Props) {
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
            <li>
              <a>ローカル</a>
            </li>
          </ul>
        </li>
        <li>
          <h2 className="menu-title">リスト</h2>
        </li>
        <li>
          <h2 className="menu-title">サーバー</h2>
          <ul>
            <li>
              <a>メンバー</a>
            </li>
            <li>
              <a>追跡中のユーザー</a>
            </li>
          </ul>
        </li>
        <li>
          <a>検索</a>
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
