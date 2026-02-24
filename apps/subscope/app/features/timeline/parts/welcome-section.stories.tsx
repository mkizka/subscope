import type { Meta, StoryObj } from "@storybook/react-vite";

import { WelcomeSection } from "./welcome-section";

const meta = {
  title: "features/Timeline/WelcomeSection",
  component: WelcomeSection,
} satisfies Meta<typeof WelcomeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    atprotoProxy: "did:web:example.com#atproto_appview",
  },
};
