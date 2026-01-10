import { useState } from "preact/hooks";

import { DashboardPresenter, type DashboardStats } from "./presenter";

type InviteCode = {
  id: string;
  code: string;
  createdAt: string;
  usedBy: string | null;
  status: "未使用" | "使用済み";
};

type Account = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  joinedAt: string;
  status: "アクティブ" | "停止中";
};

const mockInviteCodes: InviteCode[] = [
  {
    id: "1",
    code: "INVITE-ABC123",
    createdAt: "2024-01-15",
    usedBy: null,
    status: "未使用",
  },
  {
    id: "2",
    code: "INVITE-DEF456",
    createdAt: "2024-01-14",
    usedBy: "@tanaka.bsky",
    status: "使用済み",
  },
  {
    id: "3",
    code: "INVITE-GHI789",
    createdAt: "2024-01-13",
    usedBy: null,
    status: "未使用",
  },
];

const mockAccounts: Account[] = [
  {
    id: "1",
    name: "田中太郎",
    handle: "@tanaka.bsky.social",
    avatar: "",
    joinedAt: "2024-01-10",
    status: "アクティブ",
  },
  {
    id: "2",
    name: "佐藤花子",
    handle: "@hanako.bsky.social",
    avatar: "",
    joinedAt: "2024-01-08",
    status: "アクティブ",
  },
  {
    id: "3",
    name: "山田次郎",
    handle: "@jiro.bsky.social",
    avatar: "",
    joinedAt: "2024-01-05",
    status: "アクティブ",
  },
];

export function DashboardContainer() {
  const [inviteCodes] = useState<InviteCode[]>(mockInviteCodes);
  const [accounts] = useState<Account[]>(mockAccounts);

  const stats: DashboardStats = {
    totalUsers: accounts.length,
    unusedInviteCodes: inviteCodes.filter((c) => c.status === "未使用").length,
    todayNewUsers: 0,
  };

  return <DashboardPresenter stats={stats} />;
}
