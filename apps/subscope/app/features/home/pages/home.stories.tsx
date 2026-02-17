import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomePage } from "./home";

const meta = {
  title: "pages/home",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
