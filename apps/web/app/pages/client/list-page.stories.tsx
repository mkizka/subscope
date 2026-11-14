import { asAtUriString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
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

const hasSpinner = (button: HTMLElement) =>
  button.querySelector(".animate-spin") !== null;

export const Deleting: Story = {
  name: "list-s2: リスト詳細の「…」ボタンは削除してリスト一覧に戻るまでスピナーを出して押せなくする",
  parameters: { pending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "操作" });

    await userEvent.click(button);
    await userEvent.click(canvas.getByRole("button", { name: "削除する" }));
    await userEvent.click(
      within(canvas.getByRole("dialog")).getByRole("button", {
        name: "削除する",
      }),
    );

    await expect(button).toBeDisabled();
    await expect(hasSpinner(button)).toBe(true);
  },
};

export const MemberSubmitting: Story = {
  name: "list-s3: リストのメンバーの追加・削除ボタンは、送信が終わるまでスピナーを出して押せなくする",
  parameters: {
    path: "/alice.bsky.social/lists/1?tab=members",
    pending: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole("button", { name: "追加する" });
    const remove = canvas.getByRole("button", { name: "削除" });
    await userEvent.type(canvas.getByLabelText("ハンドル"), "carol.test");

    await userEvent.click(add);
    await userEvent.click(remove);

    await expect(add).toBeDisabled();
    await expect(hasSpinner(add)).toBe(true);
    await expect(remove).toBeDisabled();
    await expect(hasSpinner(remove)).toBe(true);
  },
};

export const Loading: Story = {
  name: "list-s6: リスト詳細を開くと、リストの読み込みを待たずに画面を表示し、読み込み終えるまでスケルトンを表示する",
  beforeEach: () => {
    queryClient.removeQueries({ queryKey: ["list", alice.handle, "1"] });
    void queryClient.query({
      queryKey: ["list", alice.handle, "1", "posts"],
      queryFn: () => new Promise<never>(() => {}),
    });
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("status", {
        name: "読み込み中",
      }),
    ).toBeVisible();
  },
};
