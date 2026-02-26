
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import reportsRoutes from './routes/reports.js';
import './workers/processor.js'; 


import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api", meRoutes);
app.use('/api/reports', reportsRoutes);


// Root route
app.get("/", (req, res) => {
  res.send({ ok: true, message: "HealthScan backend running" });
});


const start = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("MongoDB (Atlas) connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB Atlas:", err.message || err);
    process.exit(1);
  }
};

start();
