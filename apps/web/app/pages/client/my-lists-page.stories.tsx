import { asAtUriString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as listsLoader } from "@/app/routes/api.lists.$handle";

import { MyListsPage } from "./my-lists-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof listsLoader>>(
      ["lists", alice.handle],
      {
        lists: [
          {
            uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/1"),
            rkey: "1",
            creatorDid: alice.did,
            name: "友達",
            description: "よく話す人たち",
          },
          {
            uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/2"),
            rkey: "2",
            creatorDid: alice.did,
            name: "ニュース",
          },
        ],
        isSelf: true,
      },
    );
  },
  component: MyListsPage,
  parameters: {
    path: "/lists",
    layout: "fullscreen",
  },
} satisfies Meta<typeof MyListsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof listsLoader>>(
      ["lists", alice.handle],
      { lists: [], isSelf: true },
    );
  },
};

export const ListAvatar: Story = {
  name: "list-s7: リスト一覧の各行の左に、リストのアバター画像を表示し、未設定ならリストのアイコンを表示する",
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof listsLoader>>(
      ["lists", alice.handle],
      {
        lists: [
          {
            uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/1"),
            rkey: "1",
            creatorDid: alice.did,
            name: "アバターあり",
            avatarUrl:
              "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
          },
          {
            uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/2"),
            rkey: "2",
            creatorDid: alice.did,
            name: "アバターなし",
          },
        ],
        isSelf: true,
      },
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = (name: string) =>
      canvas.getByRole("link", { name: new RegExp(name) });

    await expect(row("アバターあり").querySelector("img")).not.toBeNull();
    await expect(row("アバターなし").querySelector("img")).toBeNull();
    await expect(row("アバターなし").querySelector("svg")).not.toBeNull();
  },
};
