import { asAtUriString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, bob, type Data, queryClient } from "@/.storybook/query-client";
import ListDetailStories from "@/app/features/list/list-detail.stories";
import type { loader as listLoader } from "@/app/routes/api.list.$handle.$rkey";

import { ListPage } from "./list-page";

const meta = {
  beforeEach: () => {
    for (const tab of ["posts", "members"]) {
      queryClient.setQueryData<Data<typeof listLoader>>(
        ["list", alice.handle, "1", tab],
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
    }
  },
  component: ListPage,
  args: { handle: "alice.bsky.social", rkey: "1" },
  parameters: {
    path: "/alice.bsky.social/lists/1",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MemberSyncStatus: Story = {
  name: "list-s4: 「メンバー」タブの追跡アカウントには、過去の投稿の同期状態を表示する",
  parameters: { path: "/alice.bsky.social/lists/1?tab=members" },
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof listLoader>>(
      ["list", alice.handle, "1", "members"],
      {
        list: {
          uri: asAtUriString(ListDetailStories.args.uri),
          rkey: "1",
          creatorDid: alice.did,
          name: ListDetailStories.args.name,
        },
        posts: [],
        members: [
          {
            listItemUri: "at://did:plc:alice/app.bsky.graph.listitem/1",
            ...bob,
            backfillStatus: "completed",
          },
        ],
        isSelf: true,
      },
    );
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("同期済み", { exact: true }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["list", alice.handle, "1"] });
    void queryClient.query({
      queryKey: ["list", alice.handle, "1", "posts"],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
};
