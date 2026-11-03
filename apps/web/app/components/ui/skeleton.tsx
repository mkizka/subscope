import { clsx } from "clsx";

type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block rounded-full bg-surface-2", className)}
    />
  );
}
