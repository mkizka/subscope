import path from "node:path";

import express from "express";

const isDevelopment = process.env.NODE_ENV === "development";
const port = process.env.PORT ?? 3005;

const app = express();

if (isDevelopment) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(import.meta.dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("*all", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Subscope server running at http://localhost:${port}`);
});
