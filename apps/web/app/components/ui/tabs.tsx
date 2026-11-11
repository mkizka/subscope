import { clsx } from "clsx";
import { Link } from "react-router";

type Props = {
  tabs: { to: string; label: string; selected: boolean }[];
  onSelect?: (to: string) => void;
};

export function Tabs({ tabs, onSelect }: Props) {
  return (
    <div
      role="tablist"
      className="
        sticky top-14 z-sticky flex border-b border-line bg-surface
        transition-[top]
        lg:top-0
        max-lg:[main:has(>header[data-visible=false])_&]:top-0
      "
    >
      {tabs.map(({ to, label, selected }) => (
        <Link
          key={to}
          to={to}
          onClick={() => onSelect?.(to)}
          role="tab"
          aria-selected={selected}
          className={clsx(
            `
              flex h-11 flex-1 items-center justify-center border-b-3 text-label
              hover:bg-surface-2
            `,
            selected
              ? "border-brand font-bold text-ink"
              : "border-transparent text-muted",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
