import express from "express";
import cors from "cors";

// routes
import orderRoutes from "src/routes/Orders-routes.js";
import orderItemRoutes from "src/routes/OrderItems-routes.js";
import billSplitRoutes from "src/routes/BillSplits-routes.js";
import paymentRoutes from "src/routes/Payment-routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // ใช้ express.json() แทน body-parser

// Routes
app.use("/orders", orderRoutes);
app.use("/order-items", orderItemRoutes);
app.use("/bill-splits", billSplitRoutes);
app.use("/payments", paymentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
