import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

type Props = {
  children: ReactNode;
  verticalCenter?: boolean;
};

export const AppLayout = ({ children, verticalCenter }: Props) => {
  return (
    <div className="flex size-full justify-center">
      <div
        className={cn(
          "flex w-full max-w-lg flex-col items-center p-2",
          verticalCenter && "justify-center",
        )}
      >
        {children}
      </div>
    </div>
  );
};
