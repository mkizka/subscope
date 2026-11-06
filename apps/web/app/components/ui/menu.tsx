import { type ReactNode, useId } from "react";

import { Button } from "./button";

type Props = {
  label: string;
  trigger: ReactNode;
  placement?: "bottom" | "top";
  loading?: boolean;
  children: ReactNode;
};

export const menuItemClass =
  "flex w-full items-center gap-2 px-4 py-2 text-left text-label hover:bg-surface-2";

export function Menu({
  label,
  trigger,
  placement = "bottom",
  loading,
  children,
}: Props) {
  const id = useId();
  const anchor = `--${id.replace(/[^\w-]/g, "")}`;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        popoverTarget={id}
        aria-label={label}
        loading={loading}
        style={{ anchorName: anchor }}
      >
        {!loading && trigger}
      </Button>
      <div
        id={id}
        popover="auto"
        className="
          m-0 min-w-40 rounded-xl border border-line bg-surface py-1 text-ink
          shadow-lg
        "
        style={{
          positionAnchor: anchor,
          positionArea: `${placement} span-left`,
          positionTryFallbacks: "flip-inline",
        }}
        onClick={(e) => e.currentTarget.hidePopover()}
      >
        {children}
      </div>
    </>
  );
}
