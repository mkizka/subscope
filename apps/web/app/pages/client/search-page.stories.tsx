import type { Meta, StoryObj } from "@storybook/react-vite";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as searchLoader } from "@/app/routes/api.search";

import { SearchPage } from "./search-page";

const meta = {
  beforeEach: () => {
    const search = (
      tab: "accounts" | "posts",
      q: string,
      result: Partial<Data<typeof searchLoader>>,
    ) =>
      queryClient.setQueryData<Data<typeof searchLoader>>(["search", tab, q], {
        accounts: [],
        posts: [],
        ...result,
      });
    search("accounts", "alice", {
      accounts: [{ ...alice, description: "Blueskyを使っています。" }],
    });
    search("accounts", "nobody", {});
    search("posts", "alice", { posts: TimelineFeedStories.args.posts });
    search("posts", "nobody", {});
  },
  component: SearchPage,
  args: {
    q: "alice",
    tab: "posts",
  },
  parameters: {
    path: "/search",
    layout: "fullscreen",
  },
} satisfies Meta<typeof SearchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotFound: Story = {
  args: { q: "nobody" },
};

export const Accounts: Story = {
  args: {
    tab: "accounts",
  },
};

export const AccountsNotFound: Story = {
  args: { q: "nobody", tab: "accounts" },
};

export const Empty: Story = {
  args: { q: undefined },
};
