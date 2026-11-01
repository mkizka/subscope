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

const statusClass = {
  active: "bg-brand-soft text-brand",
  used: "bg-surface-2 text-muted",
  expired: "bg-surface-2 text-muted",
} as const;

export function StatusBadge(props: Props) {
  const status = getStatus(props);
  return (
    <span
      className={`
        shrink-0 rounded-full px-2.5 py-0.5 text-caption font-bold
        ${statusClass[status]}
      `}
    >
      {statusLabel[status]}
    </span>
  );
}
