import express from "express";

const app = express();
const PORT = 3001;

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Ingester server listening on port ${PORT}`);
});
