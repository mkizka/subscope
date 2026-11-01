import { clsx } from "clsx";
import { Link } from "react-router";

type Props = {
  tabs: { to: string; label: string; selected: boolean }[];
};

export function Tabs({ tabs }: Props) {
  return (
    <div role="tablist" className="flex border-b border-line">
      {tabs.map(({ to, label, selected }) => (
        <Link
          key={to}
          to={to}
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
