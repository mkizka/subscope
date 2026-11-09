import type { Meta, StoryObj } from "@storybook/react-vite";

import { PostForm } from "./post-form";

const meta = {
  component: PostForm,
  args: {
    open: true,
    isSubmitting: false,
    author: { displayName: "アリス", handle: "alice.test" },
    onCancel: () => {},
    onSubmit: () => {},
  },
} satisfies Meta<typeof PostForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const post = {
  authorDisplayName: "山田花子",
  authorHandle: "hanako.bsky.social",
  text: "今日の勉強会のスライドを公開しました！ATプロトコルのリポジトリ構造とFirehoseの話がメインです。質問があればリプライでどうぞ。後半のデモで使ったコードもGitHubに置いてあります。",
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

export const Default: Story = {};

export const Reply: Story = {
  args: { target: { type: "reply", post } },
};

export const Quote: Story = {
  args: { target: { type: "quote", post } },
};
