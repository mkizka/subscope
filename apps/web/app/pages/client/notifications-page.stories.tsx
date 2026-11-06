import { asDatetimeString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { bob, infinite, queryClient } from "@/.storybook/query-client";
import type { loader as notificationsLoader } from "@/app/routes/api.notifications";

import { NotificationsPage } from "./notifications-page";

const meta = {
  beforeEach: () => {
    const indexedAt = asDatetimeString(new Date().toISOString());
    queryClient.setQueryData(
      ["notifications"],
      infinite<typeof notificationsLoader>({
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
      }),
    );
  },
  component: NotificationsPage,
  parameters: {
    path: "/notifications",
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotificationsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    queryClient.setQueryData(
      ["notifications"],
      infinite<typeof notificationsLoader>({
        notifications: [],
        cursor: undefined,
        subjectTexts: {},
      }),
    );
  },
};
