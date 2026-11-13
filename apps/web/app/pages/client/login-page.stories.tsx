import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { LoginPage } from "./login-page";

const meta = {
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    step: "login",
  },
} satisfies Meta<typeof LoginPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Setup: Story = {
  args: {
    step: "setup",
  },
};

export const InviteCode: Story = {
  args: {
    step: "inviteCode",
  },
};

export const SetupNotice: Story = {
  name: "login-s1: 管理者がまだいないサーバーでは、最初にログインしたアカウントが管理者になることをログイン画面に出す",
  args: {
    step: "setup",
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        "最初にログインしたアカウントがこのサーバーの管理者になります",
      ),
    ).toBeVisible();
  },
};

export const Description: Story = {
  name: "login-s2: ログイン画面にはBlueskyのアカウントでログインする招待制のサーバーであることを出す",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        "招待制のBluesky互換サーバーです。Blueskyのアカウントでログインします。",
      ),
    ).toBeVisible();
  },
};

export const InviteCodeSteps: Story = {
  name: "login-s3: 招待コードの入力を求めるときは「ログイン」「招待コード」の2段階の手順を出し、今が「招待コード」の段階であることを示す",
  args: {
    step: "inviteCode",
  },
  play: async ({ canvasElement }) => {
    const steps = within(canvasElement).getByRole("list", { name: "手順" });
    const items = within(steps).getAllByRole("listitem");
    await expect(items.map((item) => item.textContent)).toEqual([
      "ログイン",
      "招待コード",
    ]);
    await expect(
      steps.querySelector('[aria-current="step"]'),
    ).toHaveTextContent("招待コード");
  },
};

export const LoginSubmitting: Story = {
  name: "login-s4: 「ログイン」を押してから認証画面に移動するまで、ログインボタンを無効にしてスピナーを出す",
  parameters: {
    pending: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("ハンドル"), "alice.test");
    await userEvent.click(canvas.getByRole("button", { name: "ログイン" }));
    await expect(
      canvas.getByRole("button", { name: "ログイン" }),
    ).toBeDisabled();
  },
};

export const MemberNotice: Story = {
  name: "login-s5: 管理者がいるサーバーのログイン画面には、登録していないアカウントはログイン後に招待コードの入力が必要なことを出す",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        "このサーバーに登録していないアカウントは、ログイン後に招待コードの入力が必要です",
      ),
    ).toBeVisible();
  },
};

export const InviteCodeSubmitting: Story = {
  name: "login-s6: 「登録する」を押してから結果が出るまで、登録ボタンを無効にしてスピナーを出す",
  args: {
    step: "inviteCode",
  },
  parameters: {
    path: "/login",
    pending: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("招待コード"), "invalid-code");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await expect(
      canvas.getByRole("button", { name: "登録する" }),
    ).toBeDisabled();
  },
};

export const Register: Story = {
  args: {
    tab: "register",
  },
};

export const InviteCodeError: Story = {
  args: {
    step: "inviteCode",
    inviteCodeError: "招待コードが無効または期限切れです",
  },
};

export const Tabs: Story = {
  name: "login-s7: 管理者がいるサーバーのログイン画面には「ログイン」「新規登録」のタブを出し、最初は「ログイン」を選ぶ",
  play: async ({ canvasElement }) => {
    const tabs = within(canvasElement).getAllByRole("tab");
    await expect(tabs.map((tab) => tab.textContent)).toEqual([
      "ログイン",
      "新規登録",
    ]);
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  },
};

export const RegisterFields: Story = {
  name: "login-s8: 「新規登録」タブにはハンドルと招待コードの入力欄を出す",
  args: {
    tab: "register",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("ハンドル")).toBeVisible();
    await expect(canvas.getByLabelText("招待コード")).toBeVisible();
  },
};

export const SetupWithoutTabs: Story = {
  name: "login-s9: 管理者がまだいないサーバーのログイン画面には、タブを出さない",
  args: {
    step: "setup",
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("tab"),
    ).not.toBeInTheDocument();
  },
};

export const PassportButton: Story = {
  name: "login-s10: ログインタブには「@passportでログイン」ボタンを出す",
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "@passportでログイン" }),
    ).toHaveAttribute("href", "/login/atpassport");
  },
};
