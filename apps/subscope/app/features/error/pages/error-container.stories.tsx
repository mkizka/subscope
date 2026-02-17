import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorPageContainer } from "./error-container";

const meta = {
  title: "pages/error",
  component: ErrorPageContainer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ErrorPageContainer>;

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
