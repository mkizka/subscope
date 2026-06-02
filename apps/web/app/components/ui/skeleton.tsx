import { cn } from "@/app/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        `
          animate-pulse rounded-2xl bg-primary/8
          dark:bg-primary/12
        `,
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
