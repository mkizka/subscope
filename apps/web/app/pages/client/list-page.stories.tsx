import { asAtUriString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import ListDetailStories from "@/app/features/list/blocks/list-detail.stories";
import type { loader as listLoader } from "@/app/routes/api.list.$handle.$rkey";

import { ListPage } from "./list-page";

const meta = {
  beforeEach: () => {
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
