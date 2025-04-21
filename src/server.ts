import express from "express";
import cors from "cors";
import { json } from "express";
import router from "./routes/router";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(json());

// Routes
app.use("/api", router);

// Basic Route
app.get("/", (req, res) => {
  res.send("Trading Engine is Running");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});

export default app;
