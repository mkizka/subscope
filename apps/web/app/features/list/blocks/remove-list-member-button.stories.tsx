import type { Meta, StoryObj } from "@storybook/react-vite";

import { RemoveListMemberButton } from "./list-member-forms";

const meta = {
  component: RemoveListMemberButton,
  args: {
    listItemUri: "at://did:plc:alice/app.bsky.graph.listitem/1",
  },
} satisfies Meta<typeof RemoveListMemberButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
