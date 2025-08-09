import type { ReactNode } from "react";
import { Form } from "react-router";

interface LayoutProps {
  children: ReactNode;
  userDid: string;
}

export function Layout({ children, userDid }: LayoutProps) {
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
                <div className="text-sm text-base-content/60">
                  <span className="font-mono text-xs">{userDid}</span>
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
