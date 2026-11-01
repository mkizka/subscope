import { ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";

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
              <Avatar src={actor.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-bold">
                  {actor.displayName || profileId}
                </p>
                <p className="truncate text-label text-muted">@{profileId}</p>
                {actor.description && (
                  <p className="truncate text-label">{actor.description}</p>
                )}
              </div>
              {actor.isAdmin && (
                <Badge>
                  <ShieldIcon className="mr-1 size-3" />
                  管理者
                </Badge>
              )}
              {actor.subscriberFollowersCount !== undefined && (
                <Badge>
                  メンバー{actor.subscriberFollowersCount}人がフォロー
                </Badge>
              )}
            </Link>
            {renderAction?.(actor)}
          </li>
        );
      })}
    </ul>
  );
}
