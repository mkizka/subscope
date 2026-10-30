import { ShieldIcon } from "lucide-react";
import { Link } from "react-router";

export type Actor = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  subscriberFollowersCount?: number;
  isAdmin?: boolean;
};

type Props = {
  actors: Actor[];
};

export function ActorList({ actors }: Props) {
  return (
    <ul className="list">
      {actors.map((actor) => {
        const profileId =
          actor.handle === "handle.invalid" ? actor.did : actor.handle;
        return (
          <li key={actor.did}>
            <Link
              to={`?profile=${profileId}`}
              className="
                list-row items-center
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
              </div>
              {actor.isAdmin && (
                <span className="badge badge-soft badge-sm badge-primary">
                  <ShieldIcon className="size-3" />
                  管理者
                </span>
              )}
              {actor.subscriberFollowersCount !== undefined && (
                <span className="text-sm text-base-content/60">
                  {actor.subscriberFollowersCount} メンバーがフォロー
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
