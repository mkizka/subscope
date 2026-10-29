import type { ReactNode } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";

export function AdminPage({ children }: { children: ReactNode }) {
  return (
    <ThreeColumnLayout>
      <div className="p-4">{children}</div>
    </ThreeColumnLayout>
  );
}
