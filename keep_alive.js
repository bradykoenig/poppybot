const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Pooper Patrol is on duty 💩");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`💩 Keep-alive server running on port ${PORT}`);
});
