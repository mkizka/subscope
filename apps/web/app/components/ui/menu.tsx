import { type ReactNode, useId } from "react";

import { buttonClass } from "./button";

type Props = {
  label: string;
  trigger: ReactNode;
  placement?: "bottom" | "top";
  children: ReactNode;
};

export const menuItemClass =
  "flex w-full items-center gap-2 px-4 py-2 text-left text-label hover:bg-surface-2";

export function Menu({
  label,
  trigger,
  placement = "bottom",
  children,
}: Props) {
  const id = useId();
  const anchor = `--${id.replace(/[^\w-]/g, "")}`;
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label={label}
        className={buttonClass({ variant: "ghost", size: "sm" })}
        style={{ anchorName: anchor }}
      >
        {trigger}
      </button>
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
