import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "~/utils/cn";

type Props = {
  children: ReactNode;
  className?: string;
  showBackButton?: boolean;
};

export function HeaderCard({ children, className, showBackButton }: Props) {
  return (
    <div className={cn("card bg-base-100 w-full shadow-sm", className)}>
      <div className="card-body">
        <div className="flex items-center justify-center relative">
          {showBackButton && (
            <Link to="/" className="btn btn-ghost btn-square absolute left-0">
              <span className="icon-[tabler--chevron-left] size-6"></span>
            </Link>
          )}
          <h1 className="text-xl font-bold">{children}</h1>
        </div>
      </div>
    </div>
  );
}
