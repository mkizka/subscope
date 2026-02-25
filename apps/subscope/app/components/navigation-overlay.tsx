import { useNavigation } from "react-router";

import { Spinner } from "./ui/spinner";

export function NavigationOverlay() {
  const navigation = useNavigation();

  if (navigation.state === "idle") {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-100 flex items-center justify-center bg-background/50
      "
    >
      <Spinner className="size-8" />
    </div>
  );
}
