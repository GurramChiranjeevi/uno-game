require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/games", gameRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`UNO backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
