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
  active: "有効",
  used: "使用済み",
  expired: "期限切れ",
} as const;

const statusVariant = {
  active: "default",
  used: "secondary",
  expired: "destructive",
} as const;

export function StatusBadge(props: Props) {
  const status = getStatus(props);
  return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>;
}
