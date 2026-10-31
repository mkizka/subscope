import { ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

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
  const [searchParams] = useSearchParams();
  return (
    <ul className="list">
      {actors.map((actor) => {
        const profileId =
          actor.handle === "handle.invalid" ? actor.did : actor.handle;
        const profileParams = new URLSearchParams(searchParams);
        profileParams.set("profile", profileId);
        return (
          <li key={actor.did} className="flex items-center pr-2">
            <Link
              to={`?${profileParams}`}
              preventScrollReset
              className="
                list-row min-w-0 flex-1 items-center
                hover:bg-base-200
              "
            >
              {actor.avatarUrl ? (
                <img
                  src={actor.avatarUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="size-10 rounded-full bg-base-300" />
              )}
              <div className="min-w-0 list-col-grow">
                <p className="truncate font-bold">
                  {actor.displayName || profileId}
                </p>
                <p className="truncate text-sm text-base-content/60">
                  @{profileId}
                </p>
                {actor.description && (
                  <p className="truncate text-sm">{actor.description}</p>
                )}
              </div>
              {actor.isAdmin && (
                <span className="badge badge-soft badge-sm badge-primary">
                  <ShieldIcon className="size-3" />
                  管理者
                </span>
              )}
              {actor.subscriberFollowersCount !== undefined && (
                <span className="badge badge-ghost badge-sm">
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
