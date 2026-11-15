import { createRequestHandler } from "@react-router/express";
import express from "express";
import morgan from "morgan";

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(
  "/assets",
  express.static("dist/client/assets", { immutable: true, maxAge: "1y" }),
);
app.use(express.static("dist/client", { maxAge: "1h" }));
app.use(morgan("tiny"));
app.all(
  "/{*splat}",
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
  }),
);

app.listen(Number(process.env.PORT ?? 3000));
