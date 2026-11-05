import { clsx } from "clsx";
import { User } from "lucide-react";
import type { ReactNode } from "react";

const SIZES = { sm: "size-7", md: "size-10", lg: "size-20" };
const ICON_SIZES = { sm: "size-4", md: "size-6", lg: "size-12" };

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
        <span className="text-muted" data-testid="avatar-fallback">
          {icon ?? <User className={ICON_SIZES[size]} />}
        </span>
      )}
    </span>
  );
}
