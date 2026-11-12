import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { ErrorPage } from "./error-page";

const meta = {
  component: ErrorPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: {
    error: {
      status: 404,
      statusText: "Not Found",
      data: null,
      internal: false,
    },
  },
};

export const HomeLink: Story = {
  name: "error-s1: 「ホームに戻る」を押すとトップページに移動する",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "ホームに戻る" }),
    ).toHaveAttribute("href", "/");
  },
  args: {
    error: {
      status: 404,
      statusText: "Not Found",
      data: null,
      internal: false,
    },
  },
};

export const ServerError: Story = {
  args: {
    error: {
      status: 500,
      statusText: "Internal Server Error",
      data: null,
      internal: false,
    },
  },
};

export const UnknownError: Story = {
  args: {
    error: "unknown error",
  },
};
