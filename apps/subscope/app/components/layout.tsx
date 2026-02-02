import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const AppLayout = ({ children }: Props) => {
  return (
    <div className="size-full flex justify-center">
      <div className="w-full max-w-lg p-2 flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
};
