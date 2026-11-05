import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddListMemberForm, RemoveListMemberButton } from "./list-member-forms";

const meta = {
  component: AddListMemberForm,
  args: {
    listUri: "at://did:plc:alice/app.bsky.graph.list/1",
  },
} satisfies Meta<typeof AddListMemberForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Add: Story = {};

export const Remove: Story = {
  render: () => (
    <RemoveListMemberButton listItemUri="at://did:plc:alice/app.bsky.graph.listitem/1" />
  ),
};
