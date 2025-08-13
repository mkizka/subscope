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

  return (
    <div className="bg-base-200 flex min-h-screen flex-col">
      <div className="bg-base-100 border-base-content/20 sticky top-0 z-50 flex border-b">
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {fetcher.state === "loading" ? (
                    <div className="skeleton w-8 h-8 rounded-full"></div>
                  ) : fetcher.data &&
                    "avatar" in fetcher.data &&
                    fetcher.data.avatar ? (
                    <img
                      src={fetcher.data.avatar}
                      alt={fetcher.data.displayName || fetcher.data.handle}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                      <span className="icon-[tabler--user] size-4 text-base-content/60"></span>
                    </div>
                  )}
                  <div className="text-sm">
                    {fetcher.state === "loading" ? (
                      <div>
                        <div className="skeleton h-4 w-24 mb-1"></div>
                        <div className="skeleton h-3 w-16"></div>
                      </div>
                    ) : fetcher.data && "handle" in fetcher.data ? (
                      <>
                        <div className="font-medium text-base-content">
                          {fetcher.data.displayName || fetcher.data.handle}
                        </div>
                        {fetcher.data.handle && (
                          <div className="text-xs text-base-content/60">
                            @{fetcher.data.handle}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                <Form method="post" action="/oauth/logout">
                  <button
                    type="submit"
                    className="btn btn-sm btn-soft btn-error gap-2"
                  >
                    <span className="icon-[tabler--logout] size-4"></span>
                    ログアウト
                  </button>
                </Form>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <div className="flex grow flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
