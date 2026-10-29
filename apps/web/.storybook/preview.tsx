import "@/app/app.css";
import "./preview.css";

import { asDatetimeString } from "@atproto/syntax";
import type { $OutputBody as SubscribersResponse } from "@repo/client/lex/me/subsco/admin/getSubscribers";
import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";

import type { loader as meLoader } from "@/app/routes/api.me";
import type { loader as notificationsLoader } from "@/app/routes/api.notifications";
import type { loader as unreadCountLoader } from "@/app/routes/api.notifications.unread-count";

type Data<T extends (...args: never) => unknown> =
  Awaited<ReturnType<T>> extends {
    data: infer D;
  }
    ? D
    : never;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const alice = {
  did: "did:plc:alice",
  handle: "alice.bsky.social",
  displayName: "Alice",
} as const;
const bob = {
  did: "did:plc:bob",
  handle: "bob.bsky.social",
  displayName: "Bob",
} as const;
const indexedAt = asDatetimeString(new Date().toISOString());

queryClient.setQueryData<Data<typeof meLoader>>(["me"], {
  did: alice.did,
  avatarUrl: undefined,
  handle: alice.handle,
  isAdmin: true,
});
queryClient.setQueryData<Data<typeof unreadCountLoader>>(
  ["notifications", "unread-count"],
  { count: 2 },
);
queryClient.setQueryData<{
  pages: Data<typeof notificationsLoader>[];
  pageParams: unknown[];
}>(["notifications"], {
  pages: [
    {
      notifications: [
        {
          uri: "at://did:plc:bob/app.bsky.feed.like/1",
          cid: "bafylike",
          author: bob,
          reason: "like",
          reasonSubject: "at://did:plc:alice/app.bsky.feed.post/1",
          record: {},
          isRead: false,
          indexedAt,
        },
        {
          uri: "at://did:plc:bob/app.bsky.feed.post/2",
          cid: "bafyreply",
          author: bob,
          reason: "reply",
          record: { text: "いいですね！" },
          isRead: false,
          indexedAt,
        },
        {
          uri: "at://did:plc:bob/app.bsky.graph.follow/1",
          cid: "bafyfollow",
          author: bob,
          reason: "follow",
          record: {},
          isRead: true,
          indexedAt,
        },
      ],
      cursor: undefined,
      subjectTexts: {
        "at://did:plc:alice/app.bsky.feed.post/1": "こんにちは！",
      },
    },
  ],
  pageParams: [undefined],
});
queryClient.setQueryData<{
  pages: SubscribersResponse[];
  pageParams: unknown[];
}>(["subscribers"], {
  pages: [
    {
      subscribers: [
        { profile: alice, isAdmin: true },
        { profile: bob, isAdmin: false },
      ],
    },
  ],
  pageParams: [undefined],
});

const preview: Preview = {
  decorators: [
    (Story, { parameters }) => {
      const Stub = createRoutesStub([
        { path: "*", Component: Story, action: () => null },
      ]);
      return (
        <QueryClientProvider client={queryClient}>
          <Stub initialEntries={[parameters.path ?? "/"]} />
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
