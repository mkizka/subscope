import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorCard } from "./error-card";

const meta = {
  title: "features/Error/ErrorCard",
  component: ErrorCard,
} satisfies Meta<typeof ErrorCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: {
    title: "ページが見つかりません",
    details: "お探しのページは存在しないか、移動した可能性があります。",
    status: 404,
  },
};

export const ServerError: Story = {
  args: {
    title: "ページを表示できませんでした",
    details: "予期しないエラーが発生しました。",
    status: 500,
  },
};

export const WithStack: Story = {
  args: {
    title: "エラーが発生しました",
    details: "Something went wrong",
    stack: `Error: Something went wrong
    at Module.func (/app/routes/example.tsx:10:11)
    at async Object.loader (/app/routes/example.tsx:5:3)`,
  },
};
