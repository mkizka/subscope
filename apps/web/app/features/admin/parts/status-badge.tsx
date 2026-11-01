import { Badge } from "@/app/components/ui/badge";

type Props = {
  usedAt?: string;
  expiresAt: string;
};

function getStatus(code: Props) {
  if (code.usedAt) {
    return "used" as const;
  }
  if (new Date(code.expiresAt) < new Date()) {
    return "expired" as const;
  }
  return "active" as const;
}

const statusLabel = {
  active: "未使用",
  used: "使用済み",
  expired: "期限切れ",
} as const;

export function StatusBadge(props: Props) {
  return <Badge>{statusLabel[getStatus(props)]}</Badge>;
}
