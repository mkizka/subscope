import { useState } from "preact/hooks";

import { type InviteCode, InviteCodesPresenter } from "./presenter";

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

export function InviteCodesContainer() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(mockInviteCodes);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleGenerateInviteCode = () => {
    const createdAt = new Date().toISOString().split("T")[0] ?? "";
    const newCode: InviteCode = {
      id: String(inviteCodes.length + 1),
      code: `INVITE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      createdAt,
      usedBy: null,
      status: "未使用",
    };
    setInviteCodes([newCode, ...inviteCodes]);
  };

  const handleCopyToClipboard = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <InviteCodesPresenter
      inviteCodes={inviteCodes}
      copiedCode={copiedCode}
      onGenerateInviteCode={handleGenerateInviteCode}
      onCopyToClipboard={handleCopyToClipboard}
    />
  );
}
