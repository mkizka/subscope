import type { ReactNode } from "react";
import { useEffect } from "react";
import { Form, useFetcher } from "react-router";

import type { loader as getProfileLoader } from "../routes/bff.[app.bsky.actor.getProfile].js";

interface LayoutProps {
  children: ReactNode;
  userDid: string;
}

export function Layout({ children, userDid }: LayoutProps) {
  const fetcher = useFetcher<typeof getProfileLoader>();

  useEffect(() => {
    if (userDid && fetcher.state === "idle" && !fetcher.data) {
      void fetcher.load(`/bff/app.bsky.actor.getProfile?actor=${userDid}`);
    }
  }, [userDid, fetcher]);

  const profile = fetcher.data && "$type" in fetcher.data ? fetcher.data : null;
  const displayName = profile?.displayName ?? profile?.handle ?? userDid;

  return (
    <div className="bg-base-200 flex min-h-screen flex-col">
      <header className="bg-base-100 border-base-content/20 sticky top-0 z-50 flex border-b">
        <div className="mx-auto w-full max-w-7xl">
          <nav className="navbar h-16">
            <div className="navbar-start">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="icon-[tabler--atom] text-primary-content text-lg"></span>
                </div>
                <span className="text-base-content text-xl font-bold">
                  Subscope
                </span>
              </div>
            </div>
            <div className="navbar-end">
              <div className="dropdown relative inline-flex">
                <button
                  id="dropdown-avatar"
                  type="button"
                  className="dropdown-toggle btn btn-ghost btn-circle"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  aria-label="ユーザーメニュー"
                >
                  <div className="avatar hover:opacity-80 transition-opacity">
                    <div className="size-10 rounded-full">
                      {!fetcher.data ? (
                        <div className="skeleton w-full h-full rounded-full" />
                      ) : profile?.avatar ? (
                        <img src={profile.avatar} alt={displayName} />
                      ) : (
                        <div className="w-full h-full bg-base-200 flex items-center justify-center">
                          <span className="icon-[tabler--user] size-6 text-base-content"></span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                <ul
                  className="dropdown-menu dropdown-open:opacity-100 hidden min-w-60"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="dropdown-avatar"
                >
                  <li className="dropdown-header">
                    <div>
                      <h6 className="text-base-content text-base font-semibold">
                        {displayName}
                      </h6>
                      <small className="text-base-content/50 text-sm font-normal">
                        at://{userDid}
                      </small>
                    </div>
                  </li>
                  <li>
                    <Form method="post" action="/oauth/logout">
                      <button
                        type="submit"
                        className="dropdown-item text-error"
                      >
                        <span className="icon-[tabler--logout] size-5 mr-2"></span>
                        ログアウト
                      </button>
                    </Form>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </header>
      <div className="flex grow flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
