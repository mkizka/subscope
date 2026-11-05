import type { Meta, StoryObj } from "@storybook/react-vite";

import { PostImages } from "./post-images";

const image = {
  thumb:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d97757'/%3E%3C/svg%3E",
  fullsize:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d97757'/%3E%3C/svg%3E",
  alt: "サンプル画像",
};

const meta = {
  component: PostImages,
  args: { images: [image] },
} satisfies Meta<typeof PostImages>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const Grid: Story = {
  args: {
    images: Array(4)
      .fill(null)
      .map((_, i) => ({ ...image, thumb: `${image.thumb}#${i}` })),
  },
};

export const Scrollable: Story = {
  args: {
    images: Array(6)
      .fill(null)
      .map((_, i) => ({ ...image, thumb: `${image.thumb}#${i}` })),
  },
};
