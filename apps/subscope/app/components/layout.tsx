import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const AppLayout = ({ children }: Props) => {
  return (
    <div className="flex size-full justify-center">
      <div
        className="
          flex w-full max-w-lg flex-col items-center justify-center p-2
        "
      >
        {children}
      </div>
    </div>
  );
};
