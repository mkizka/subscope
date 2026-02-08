import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "@/app/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        `
          h-10 w-full min-w-0 rounded-4xl border border-border/60 bg-muted/50
          px-4 pt-1 pb-1.5 text-base transition-all duration-200 outline-none
          file:inline-flex file:h-7 file:border-0 file:bg-transparent
          file:text-sm file:font-medium file:text-foreground
          placeholder:text-muted-foreground/70
          focus-visible:border-primary focus-visible:ring-[3px]
          focus-visible:ring-primary/40
          disabled:pointer-events-none disabled:cursor-not-allowed
          disabled:opacity-50
          aria-invalid:border-destructive aria-invalid:ring-[3px]
          aria-invalid:ring-destructive/20
          md:text-sm
          dark:aria-invalid:border-destructive/50
          dark:aria-invalid:ring-destructive/40
        `,
        className,
      )}
      {...props}
    />
  );
}

export { Input };
