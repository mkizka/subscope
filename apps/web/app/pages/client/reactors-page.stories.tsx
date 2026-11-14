import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, bob, infinite, queryClient } from "@/.storybook/query-client";
import type { loader as reactorsLoader } from "@/app/routes/api.reactors.$kind";

import { ReactorsPage } from "./reactors-page";

const setAccounts = (
  kind: "liked-by" | "reposted-by",
  accounts: Parameters<typeof infinite<typeof reactorsLoader>>[0]["accounts"],
) => {
  queryClient.setQueryData(
    ["reactors", kind, alice.handle, "selected"],
    infinite<typeof reactorsLoader>({ accounts }),
  );
};

const meta = {
  beforeEach: () => {
    setAccounts("liked-by", [{ ...bob, description: "Bobの自己紹介" }]);
    setAccounts("reposted-by", [bob]);
  },
  component: ReactorsPage,
  args: { handle: "alice.bsky.social", rkey: "selected", kind: "liked-by" },
  parameters: {
    path: "/alice.bsky.social/post/selected/liked-by",
    layout: "fullscreen",
  },
} satisfies Meta<typeof ReactorsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Reposted: Story = {
  args: { kind: "reposted-by" },
  parameters: { path: "/alice.bsky.social/post/selected/reposted-by" },
};

export const Loading: Story = {
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["reactors"] });
    queryClient
      .query({
        queryKey: ["reactors", "liked-by", alice.handle, "selected"],
        queryFn: () => new Promise<never>(() => {}),
      })
      .catch(() => {});
  },
};

export const Empty: Story = {
  name: "reactors-s2: だれもいないときは「まだいいねされていません」「まだリポストされていません」を表示する",
  beforeEach: () => setAccounts("liked-by", []),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("まだいいねされていません"),
    ).toBeVisible();
  },
};
