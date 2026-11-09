import "./app.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/root";
import { ComposeProvider } from "./features/post/post-form-container";
import { ErrorPage } from "./pages/client/error-page";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const navigation = useNavigation();
  const submitting = [navigation, ...useFetchers()].some(
    (submission) => submission.state === "submitting",
  );
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (wasSubmitting.current && !submitting) {
      void queryClient.invalidateQueries();
    }
    wasSubmitting.current = submitting;
  }, [submitting, queryClient]);

  useEffect(() => {
    // @ts-expect-error
    window.__TANSTACK_QUERY_CLIENT__ = queryClient;
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {navigation.state === "loading" && (
        <div
          role="progressbar"
          aria-label="読み込み中"
          className="
            fixed inset-x-0 top-0 z-overlay h-1 overflow-hidden bg-brand-soft
          "
        >
          <div className="h-full w-1/3 animate-progress bg-brand" />
        </div>
      )}
      <ComposeProvider>
        <Outlet />
      </ComposeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
