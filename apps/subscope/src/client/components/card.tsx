import type { ComponentChildren } from "preact";

import { cn } from "../utils/cn";

type CardProps = {
  children: ComponentChildren;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] bg-surface-container-low transition-shadow duration-300",
        "shadow-elevation-1 hover:shadow-elevation-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ComponentChildren;
  className?: string;
};

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}

type CardTitleProps = {
  children: ComponentChildren;
  className?: string;
};

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-xl font-medium leading-tight text-on-surface",
        className,
      )}
    >
      {children}
    </h3>
  );
}

type CardDescriptionProps = {
  children: ComponentChildren;
  className?: string;
};

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-on-surface-variant", className)}>
      {children}
    </p>
  );
}

type CardContentProps = {
  children: ComponentChildren;
  className?: string;
};

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
