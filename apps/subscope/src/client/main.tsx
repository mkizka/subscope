import "./global.css";

import { render } from "preact";

import { App } from "./app.tsx";
import { queryClient } from "./lib/trpc.ts";

if (process.env.NODE_ENV === "development") {
  // @ts-expect-error
  window.__TANSTACK_QUERY_CLIENT__ = queryClient;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const app = document.getElementById("app")!;
render(<App />, app);
