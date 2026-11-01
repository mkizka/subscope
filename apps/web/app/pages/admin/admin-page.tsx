import type { ReactNode } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";

export function AdminPage({ children }: { children: ReactNode }) {
  return <ThreeColumnLayout>{children}</ThreeColumnLayout>;
}
