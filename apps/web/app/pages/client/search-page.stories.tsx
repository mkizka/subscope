import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

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

export const NoSidebarSearch: Story = {
  name: "layout-s10: `/search` では、中央に検索欄があるため右カラムの検索ボックスを表示しない",
  tags: ["play"],
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvasElement }) => {
    const sidebar = within(canvasElement).getAllByRole("complementary").at(-1);

    await expect(
      within(canvasElement).getAllByRole("searchbox", { name: "検索語" }),
    ).toHaveLength(1);
    await expect(
      sidebar && within(sidebar).queryByRole("searchbox"),
    ).toBeNull();
  },
};
