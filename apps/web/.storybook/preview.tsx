import "@/app/app.css";
import "./preview.css";

import { asDatetimeString } from "@atproto/syntax";
import type { $OutputBody as SubscribersResponse } from "@repo/client/lex/me/subsco/admin/getSubscribers";
import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";

import TimelineFeedStories from "@/app/features/timeline/blocks/timeline-feed.stories";
import type { loader as meLoader } from "@/app/routes/api.me";
import type { loader as notificationsLoader } from "@/app/routes/api.notifications";
import type { loader as unreadCountLoader } from "@/app/routes/api.notifications.unread-count";
import type { loader as searchLoader } from "@/app/routes/api.search";
import type { loader as timelineLoader } from "@/app/routes/api.timeline";

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
        {
          profile: alice,
          isAdmin: true,
          subscribedAt: "2024-01-01T00:00:00.000Z",
          backfillStatus: "completed",
        },
        {
          profile: bob,
          isAdmin: false,
          subscribedAt: "2024-01-02T00:00:00.000Z",
          backfillStatus: "inProgress",
        },
      ],
      total: 2,
    },
  ],
  pageParams: [undefined],
});

queryClient.setQueryData<{
  pages: Data<typeof timelineLoader>[];
  pageParams: unknown[];
}>(["timeline"], {
  pages: [{ posts: TimelineFeedStories.args.posts }],
  pageParams: [undefined],
});

const searchQuery = (
  tab: "actors" | "posts",
  q: string,
  result: Partial<Data<typeof searchLoader>>,
) =>
  queryClient.setQueryData<Data<typeof searchLoader>>(["search", tab, q], {
    actors: [],
    posts: [],
    ...result,
  });
searchQuery("actors", "alice", {
  actors: [
    {
      ...alice,
      handle: "alice.bsky.social",
      description: "Blueskyを使っています。",
    },
  ],
});
searchQuery("actors", "nobody", {});
searchQuery("posts", "alice", { posts: TimelineFeedStories.args.posts });
searchQuery("posts", "nobody", {});

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
