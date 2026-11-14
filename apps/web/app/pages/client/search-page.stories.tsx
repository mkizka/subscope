import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import TimelineFeedStories from "@/app/features/timeline/timeline-feed.stories";
import type { loader as searchLoader } from "@/app/routes/api.search";

import { SearchPage } from "./search-page";

const search = (
  tab: "accounts" | "posts",
  q: string,
  result: Partial<Data<typeof searchLoader>> = {},
) =>
  queryClient.setQueryData<Data<typeof searchLoader>>(["search", tab, q], {
    accounts: [],
    posts: [],
    ...result,
  });

const pendingSearch = (tab: "accounts" | "posts", q: string) => {
  queryClient.removeQueries({ queryKey: ["search", tab, q] });
  queryClient
    .query({
      queryKey: ["search", tab, q],
      queryFn: () => new Promise<never>(() => {}),
    })
    .catch(() => {});
};

const meta = {
  beforeEach: () => {
    localStorage.removeItem("search-history");
    search("accounts", "alice", {
      accounts: [{ ...alice, description: "Blueskyを使っています。" }],
    });
    search("accounts", "nobody");
    search("posts", "alice", { posts: TimelineFeedStories.args.posts });
    search("posts", "nobody");
  },
  component: SearchPage,
  parameters: {
    path: "/search?q=alice",
    layout: "fullscreen",
  },
} satisfies Meta<typeof SearchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotFound: Story = {
  name: "search-s3: 一致する投稿がないときは「投稿が見つかりません」と表示する",
  parameters: { path: "/search?q=nobody" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("投稿が見つかりません"),
    ).toBeVisible();
  },
};

export const Accounts: Story = {
  parameters: { path: "/search?q=alice&tab=accounts" },
};

export const AccountsNotFound: Story = {
  name: "search-s1: 一致するアカウントがないときは「ユーザーが見つかりません」と表示する",
  parameters: { path: "/search?q=nobody&tab=accounts" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("ユーザーが見つかりません"),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  name: "search-s7: 検索語がないときは、検索欄の下に探せる対象（追跡アカウントと投稿）の説明を出す",
  parameters: { path: "/search" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        "このサーバーに保存されているアカウントと投稿を検索できます",
        { exact: false },
      ),
    ).toBeVisible();
  },
};

export const FromUrl: Story = {
  name: "search-s2: URLに `?q=検索語` があると、検索欄にその語を入れて、投稿タブで検索結果を表示する",
  parameters: { path: "/search?q=alice" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("searchbox", { name: "検索語" })).toHaveValue(
      "alice",
    );
    await expect(canvas.getAllByRole("article").length).toBeGreaterThan(0);
  },
};

export const Submitting: Story = {
  name: "search-s4: 検索ボタンは検索結果を読み込み終えるまでスピナーを出して押せなくする",
  beforeEach: () => pendingSearch("posts", "alice"),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "検索" });

    await expect(button).toBeDisabled();
    await expect(button.querySelector(".animate-spin")).not.toBeNull();
  },
};

export const AccountSyncStatus: Story = {
  name: "search-s5: アカウントの検索結果には過去の投稿の同期状態を表示する",
  parameters: { path: "/search?q=alice&tab=accounts" },
  beforeEach: () => {
    search("accounts", "alice", {
      accounts: [{ ...alice, backfillStatus: "completed" }],
    });
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("同期済み", { exact: true }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  beforeEach: () => pendingSearch("posts", "alice"),
};

const seedHistory = (words: string[]) => () => {
  localStorage.setItem("search-history", JSON.stringify(words));
  for (const word of words) {
    search("posts", word);
  }
};

const openHistory = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("searchbox", { name: "検索語" }));
  return canvas.findByRole("list", { name: "検索履歴" });
};

export const HistoryList: Story = {
  name: "searchHistory-s1: 検索欄にフォーカスすると、過去に検索した語を新しい順に最大10件、検索欄の下に表示する",
  parameters: { path: "/search?q=word5" },
  beforeEach: seedHistory(
    Array.from({ length: 11 }, (_, i) => `word${11 - i}`),
  ),
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);

    const items = within(history).getAllByRole("listitem");
    await expect(items).toHaveLength(10);
    await expect(items[0]).toHaveTextContent("word5");
    await expect(items[1]).toHaveTextContent("word11");
    await expect(
      within(history).queryByRole("link", { name: "word1" }),
    ).toBeNull();
  },
};

export const HistorySelect: Story = {
  name: "searchHistory-s2: 履歴の語を選ぶと、検索欄にその語を入れて検索する",
  parameters: { path: "/search" },
  beforeEach: seedHistory(["bar", "foo"]),
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);

    await userEvent.click(within(history).getByRole("link", { name: "foo" }));

    await expect(
      within(canvasElement).getByRole("searchbox", { name: "検索語" }),
    ).toHaveValue("foo");
  },
};

export const HistoryRemove: Story = {
  name: "searchHistory-s3: 履歴の語は個別に、または「履歴を全て削除」で全て削除できる",
  parameters: { path: "/search" },
  beforeEach: seedHistory(["bar", "foo"]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const history = await openHistory(canvasElement);

    await userEvent.click(
      within(history).getByRole("button", { name: "fooを削除" }),
    );
    await expect(history).not.toHaveTextContent("foo");
    await expect(history).toHaveTextContent("bar");

    await userEvent.click(
      canvas.getByRole("button", { name: "履歴を全て削除" }),
    );
    await expect(canvas.queryByRole("list", { name: "検索履歴" })).toBeNull();
  },
};

export const HistoryClosesOnSearch: Story = {
  name: "search-s11: 検索を実行すると、履歴を閉じる",
  parameters: { path: "/search" },
  beforeEach: seedHistory(["bar", "foo", "baz"]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openHistory(canvasElement);

    await userEvent.type(
      canvas.getByRole("searchbox", { name: "検索語" }),
      "baz{Enter}",
    );

    await expect(canvas.queryByRole("list", { name: "検索履歴" })).toBeNull();
  },
};

export const NoSidebarSearch: Story = {
  name: "layout-s11: `/search` では、中央に検索欄があるため右カラムの検索ボックスを表示しない",
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
