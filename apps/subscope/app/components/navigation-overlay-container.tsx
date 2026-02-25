import { useNavigation } from "react-router";

import { NavigationOverlay } from "./navigation-overlay";

export function NavigationOverlayContainer() {
  const navigation = useNavigation();

  if (navigation.state === "idle") {
    return null;
  }

  return <NavigationOverlay />;
}
