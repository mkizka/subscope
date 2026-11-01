import { clsx } from "clsx";

const SIZES = { sm: "size-7", md: "size-10", lg: "size-20" };

type Props = {
  src?: string;
  size?: keyof typeof SIZES;
};

export function Avatar({ src, size = "md" }: Props) {
  return (
    <span
      className={clsx(
        "block shrink-0 overflow-hidden rounded-full bg-surface-2",
        SIZES[size],
      )}
    >
      {src && <img src={src} alt="" className="size-full object-cover" />}
    </span>
  );
}
