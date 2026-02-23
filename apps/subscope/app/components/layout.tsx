import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

type Props = {
  children: ReactNode;
  header?: ReactNode;
  verticalCenter?: boolean;
};

export const AppLayout = ({ children, header, verticalCenter }: Props) => {
  return (
    <div className={cn("flex size-full flex-col", header && "pt-12")}>
      {header}
      <div className="flex flex-1 justify-center">
        <div
          className={cn(
            "flex w-full max-w-lg flex-col items-center px-2",
            verticalCenter && "justify-center",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
