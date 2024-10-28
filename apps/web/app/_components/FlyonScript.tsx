"use client";

import type { IStaticMethods } from "flyonui/flyonui";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

export default function FlyonuiScript() {
  const path = usePathname();

  useEffect(() => {
    const loadFlyonui = async () => {
      await import("flyonui/flyonui");
      window.HSStaticMethods.autoInit();
    };
    void loadFlyonui();
  }, [path]);

  return null;
}
