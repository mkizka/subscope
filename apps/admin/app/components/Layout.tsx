import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function Layout({ children }: Props) {
  return (
    <div className="bg-base-200 min-h-dvh">
      <div className="container mx-auto h-full min-h-dvh max-w-md p-4">
        {children}
      </div>
    </div>
  );
}
