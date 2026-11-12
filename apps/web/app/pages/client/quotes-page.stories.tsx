import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, bob, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as quotesLoader } from "@/app/routes/api.quotes";

import { QuotesPage } from "./quotes-page";

const quote = (id: number, text: string) => ({
  uri: `at://did:plc:bob/app.bsky.feed.post/${id}`,
  cid: `bafyexample${id}`,
  authorDisplayName: bob.displayName,
  authorHandle: bob.handle,
  text,
  createdAt: new Date().toISOString(),
});

const setQuotes = (posts: ReturnType<typeof quote>[]) => {
  queryClient.setQueryData<{
    pages: Data<typeof quotesLoader>[];
    pageParams: undefined[];
  }>(["quotes", alice.handle, "selected"], {
    pages: [{ posts }],
    pageParams: [undefined],
  });
};

const meta = {
  beforeEach: () =>
    setQuotes([quote(1, "引用した投稿です"), quote(2, "別の引用です")]),
  component: QuotesPage,
  args: { handle: "alice.bsky.social", rkey: "selected" },
  parameters: {
    path: "/alice.bsky.social/post/selected/quotes",
    layout: "fullscreen",
  },
} satisfies Meta<typeof QuotesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  name: "quotes-s2: 引用がないときは「まだ引用されていません」を表示する",
  beforeEach: () => setQuotes([]),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("まだ引用されていません"),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  name: "quotes-s1: 引用一覧を開くと、読み込みを待たずに見出しを表示し、読み込み終えるまでスケルトンを表示する",
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["quotes", alice.handle] });
    queryClient
      .query({
        queryKey: ["quotes", alice.handle, "selected"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "引用" })).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "読み込み中" }),
    ).toBeVisible();
  },
};
