import { clsx } from "clsx";

type Props = {
  className?: string;
};

export function Skeleton({ className }: Props) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block skeleton rounded-full", className)}
    />
  );
}
