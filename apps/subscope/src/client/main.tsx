import { render } from "preact";

import { App } from "./app.tsx";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const app = document.getElementById("app")!;
render(<App />, app);
