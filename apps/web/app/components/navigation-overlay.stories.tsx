import type { Meta, StoryObj } from "@storybook/react-vite";

import { NavigationOverlay } from "./navigation-overlay";

const meta = {
  title: "components/NavigationOverlay",
  component: NavigationOverlay,
  decorators: [
    (Story) => (
      <div>
        <Story />
        <p>Background content</p>
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NavigationOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
