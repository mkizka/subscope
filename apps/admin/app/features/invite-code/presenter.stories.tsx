import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { InviteCodePresenter } from "./presenter";

const meta = {
  title: "Features/InviteCode",
  component: InviteCodePresenter,
  args: {
    inviteCodes: [
      {
        code: "subscope-abc12",
        createdAt: "2024-01-01T09:00:00.000Z",
        expiresAt: "2024-02-01T09:00:00.000Z",
      },
      {
        code: "subscope-def34",
        createdAt: "2024-01-02T10:00:00.000Z",
        expiresAt: "2024-02-02T10:00:00.000Z",
        usedAt: "2024-01-06T13:00:00.000Z",
      },
      {
        code: "subscope-ghi56",
        createdAt: "2024-01-03T11:00:00.000Z",
        expiresAt: "2024-02-03T11:00:00.000Z",
        usedAt: "2024-01-05T12:00:00.000Z",
        usedBy: {
          did: "did:plc:abc123",
          handle: "alice.test",
        },
      },
    ],
    error: null,
    createInviteCode: fn(),
    isCreatingInviteCode: false,
    createdInviteCode: undefined,
    isModalOpen: false,
    setIsModalOpen: fn(),
    reload: fn(),
    loadMore: fn(),
    hasMore: false,
    isFetching: false,
    isRefetching: false,
  },
} satisfies Meta<typeof InviteCodePresenter>;

export default meta;
type Story = StoryObj<typeof InviteCodePresenter>;

export const Default: Story = {};

export const TooLongCode: Story = {
  args: {
    inviteCodes: [
      {
        code: "subscope-abcdefghijklmnopqrstuvwxyz",
        createdAt: "2024-01-01T09:00:00.000Z",
        expiresAt: "2024-02-01T09:00:00.000Z",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    inviteCodes: [],
  },
};

export const Loading: Story = {
  args: {
    isFetching: true,
    hasMore: true,
  },
};

export const Refreshing: Story = {
  args: {
    isRefetching: true,
  },
};

export const Creating: Story = {
  args: {
    isCreatingInviteCode: true,
  },
};

export const WithError: Story = {
  args: {
    inviteCodes: undefined,
    error: new Error("Failed to load data"),
  },
};

export const WithModal: Story = {
  args: {
    createdInviteCode: "subscope-xyz99",
    isModalOpen: true,
  },
};

export const HasMore: Story = {
  args: {
    hasMore: true,
  },
};
