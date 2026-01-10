import type { ComponentChildren } from "preact";

import { cn } from "../utils/cn";

type AvatarProps = {
  children: ComponentChildren;
  className?: string;
};

export function Avatar({ children, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

type AvatarImageProps = {
  src?: string;
  alt?: string;
};

export function AvatarImage({ src, alt }: AvatarImageProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className="aspect-square h-full w-full object-cover"
    />
  );
}

type AvatarFallbackProps = {
  children: ComponentChildren;
  className?: string;
};

export function AvatarFallback({ children, className }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full",
        "bg-primary-container text-on-primary-container",
        "text-sm font-semibold",
        className,
      )}
    >
      {children}
    </div>
  );
}
