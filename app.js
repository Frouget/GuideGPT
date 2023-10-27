const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.listen(port, () => {
  console.log(`Running at http://localhost:${port}`);
});
