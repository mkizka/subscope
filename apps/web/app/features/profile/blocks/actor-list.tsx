import { ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

export type Actor = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  subscriberFollowersCount?: number;
  isAdmin?: boolean;
};

type Props<T extends Actor> = {
  actors: T[];
  renderAction?: (actor: T) => ReactNode;
};

export function ActorList<T extends Actor>({ actors, renderAction }: Props<T>) {
  return (
    <ul>
      {actors.map((actor) => {
        const profileId =
          actor.handle === "handle.invalid" ? actor.did : actor.handle;
        return (
          <li
            key={actor.did}
            className="flex items-center border-b border-line pr-2"
          >
            <Link
              to={`/profile/${profileId}`}
              className="
                flex min-w-0 flex-1 items-center gap-3 px-4 py-3
                hover:bg-surface-2
              "
            >
              {actor.avatarUrl ? (
                <img
                  src={actor.avatarUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="size-10 shrink-0 rounded-full bg-line" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {actor.displayName || profileId}
                </p>
                <p className="truncate text-sm text-muted">@{profileId}</p>
                {actor.description && (
                  <p className="truncate text-sm">{actor.description}</p>
                )}
              </div>
              {actor.isAdmin && (
                <span
                  className="
                    flex shrink-0 items-center gap-1 rounded-full bg-brand-soft
                    px-2 py-0.5 text-xs text-brand
                  "
                >
                  <ShieldIcon className="size-3" />
                  管理者
                </span>
              )}
              {actor.subscriberFollowersCount !== undefined && (
                <span
                  className="
                    shrink-0 rounded-full border border-line px-2 py-0.5 text-xs
                    text-muted
                  "
                >
                  メンバー{actor.subscriberFollowersCount}人がフォロー
                </span>
              )}
            </Link>
            {renderAction?.(actor)}
          </li>
        );
      })}
    </ul>
  );
}
