import { clsx } from "clsx";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  header?: ReactNode;
  verticalCenter?: boolean;
};

export const AppLayout = ({ children, header, verticalCenter }: Props) => {
  return (
    <div className={clsx("flex size-full flex-col", header && "pt-12")}>
      {header}
      <div className="flex flex-1 justify-center">
        <div
          className={clsx(
            "flex w-full max-w-lg flex-col",
            verticalCenter && "justify-center",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
