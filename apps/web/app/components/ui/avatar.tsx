import { clsx } from "clsx";
import type { ReactNode } from "react";

const SIZES = { sm: "size-7", md: "size-10", lg: "size-20" };

type Props = {
  src?: string;
  size?: keyof typeof SIZES;
  icon?: ReactNode;
};

export function Avatar({ src, size = "md", icon }: Props) {
  return (
    <span
      className={clsx(
        `
          flex shrink-0 items-center justify-center overflow-hidden rounded-full
          bg-surface-2
        `,
        SIZES[size],
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-muted">{icon}</span>
      )}
    </span>
  );
}
