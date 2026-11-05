import "@/app/app.css";
import "./preview.css";

import { asAtUriString, asDatetimeString } from "@atproto/syntax";
import type { $OutputBody as RegisteredAccountsResponse } from "@repo/client/me/subsco/admin/listRegisteredAccounts";
import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";

import ListDetailStories from "@/app/features/list/blocks/list-detail.stories";
import TimelineFeedStories from "@/app/features/timeline/blocks/timeline-feed.stories";
import type { loader as inviteCodesLoader } from "@/app/routes/admin.api.invite-codes";
import type { loader as listLoader } from "@/app/routes/api.list.$handle.$rkey";
import type { loader as listsLoader } from "@/app/routes/api.lists.$handle";
import type { loader as meLoader } from "@/app/routes/api.me";
import type { loader as notificationsLoader } from "@/app/routes/api.notifications";
import type { loader as unreadCountLoader } from "@/app/routes/api.notifications.unread-count";
import type { loader as profileLoader } from "@/app/routes/api.profile.$handle";
import type { loader as followListLoader } from "@/app/routes/api.profile.$handle.$kind";
import type { loader as registeredAccountsLoader } from "@/app/routes/api.registered-accounts";
import type { loader as searchLoader } from "@/app/routes/api.search";
import type { loader as serverInfoLoader } from "@/app/routes/api.server-info";
import type { loader as threadLoader } from "@/app/routes/api.thread";
import type { loader as timelineLoader } from "@/app/routes/api.timeline";
import type { loader as trackedAccountsLoader } from "@/app/routes/api.tracked-accounts";

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
  pages: RegisteredAccountsResponse[];
  pageParams: unknown[];
}>(["registeredAccounts"], {
  pages: [
    {
      registeredAccounts: [
        {
          profile: alice,
          isAdmin: true,
          registeredAt: "2024-01-01T00:00:00.000Z",
          backfillStatus: "completed",
        },
        {
          profile: bob,
          isAdmin: false,
          registeredAt: "2024-01-02T00:00:00.000Z",
          backfillStatus: "inProgress",
        },
      ],
      total: 2,
    },
  ],
  pageParams: [undefined],
});

queryClient.setQueryData<Data<typeof registeredAccountsLoader>>(
  ["clientRegisteredAccounts", ""],
  {
    registeredAccounts: [
      { ...alice, isAdmin: true },
      { did: "did:plc:carol", handle: "handle.invalid", isAdmin: false },
    ],
    hasMore: false,
  },
);
queryClient.setQueryData<Data<typeof serverInfoLoader>>(["server"], {
  serviceDid: "did:web:subsco.me",
});
queryClient.setQueryData<Data<typeof trackedAccountsLoader>>(
  ["trackedAccounts", ""],
  {
    total: 3,
    accounts: [
      { ...bob, registeredFollowersCount: 3 },
      { ...alice, registeredFollowersCount: 1 },
      {
        did: "did:plc:carol",
        handle: "handle.invalid",
        registeredFollowersCount: 0,
      },
    ],
  },
);

queryClient.setQueryData<{
  pages: Data<typeof timelineLoader>[];
  pageParams: unknown[];
}>(["timeline"], {
  pages: [{ posts: TimelineFeedStories.args.posts }],
  pageParams: [undefined],
});

const searchQuery = (
  tab: "accounts" | "posts",
  q: string,
  result: Partial<Data<typeof searchLoader>>,
) =>
  queryClient.setQueryData<Data<typeof searchLoader>>(["search", tab, q], {
    accounts: [],
    posts: [],
    ...result,
  });
searchQuery("accounts", "alice", {
  accounts: [
    {
      ...alice,
      handle: "alice.bsky.social",
      description: "Blueskyを使っています。",
    },
  ],
});
searchQuery("accounts", "nobody", {});
searchQuery("posts", "alice", { posts: TimelineFeedStories.args.posts });
searchQuery("posts", "nobody", {});
queryClient.setQueryData<{
  pages: Data<typeof inviteCodesLoader>[];
  pageParams: unknown[];
}>(["inviteCodes"], {
  pages: [
    {
      codes: [
        {
          code: "abc-123-def",
          expiresAt: "2099-12-31T23:59:59.000Z",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
  pageParams: [undefined],
});
queryClient.setQueryData<Data<typeof listsLoader>>(["lists", alice.handle], {
  lists: [
    {
      uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/1"),
      rkey: "1",
      creatorDid: alice.did,
      name: "友達",
      description: "よく話す人たち",
    },
    {
      uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/2"),
      rkey: "2",
      creatorDid: alice.did,
      name: "ニュース",
    },
  ],
  isSelf: true,
});
queryClient.setQueryData<Data<typeof listLoader>>(
  ["list", alice.handle, "1", "posts"],
  {
    list: {
      uri: asAtUriString(ListDetailStories.args.uri),
      rkey: "1",
      creatorDid: alice.did,
      name: ListDetailStories.args.name,
      description: ListDetailStories.args.description,
    },
    posts: ListDetailStories.args.posts,
    members: ListDetailStories.args.members,
    isSelf: true,
  },
);

queryClient.setQueryData<Data<typeof followListLoader>>(
  ["follow-list", "alice.bsky.social", "follows", false],
  {
    subject: {
      did: "did:plc:alice",
      handle: "alice.bsky.social",
      displayName: "Alice",
    },
    accounts: [
      {
        did: "did:plc:bob",
        handle: "bob.bsky.social",
        displayName: "Bob",
        description: "Bobの自己紹介",
      },
      { did: "did:plc:carol", handle: "handle.invalid" },
    ],
  },
);

const threadPost = (uri: string, text: string) => ({
  uri,
  cid: "bafyexample",
  authorDisplayName: "Alice",
  authorHandle: alice.handle,
  text,
  createdAt: new Date().toISOString(),
});

queryClient.setQueryData<Data<typeof threadLoader>>(
  ["thread", alice.handle, "selected"],
  {
    ancestors: [threadPost("at://a/1", "親投稿です")],
    post: {
      ...threadPost("at://a/2", "選んだ投稿です"),
      replyCount: 1,
      repostCount: 1,
      likeCount: 8,
    },
    replies: [
      [
        threadPost("at://a/3", "返信です"),
        threadPost("at://a/4", "返信への返信です"),
      ],
    ],
  },
);

queryClient.setQueryData<Data<typeof profileLoader>>(
  ["profile", "alice.bsky.social", ""],
  {
    profile: {
      did: alice.did,
      handle: alice.handle,
      displayName: alice.displayName,
      description: "Blueskyを使っています。",
      followsCount: 120,
      followersCount: 345,
    },
    isSelf: false,
    posts: TimelineFeedStories.args.posts,
    tab: "posts",
  },
);

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
