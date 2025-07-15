import { required } from "@repo/common/utils";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

createRoot(required(document.getElementById("root"))).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
