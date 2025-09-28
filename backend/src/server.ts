import express from "express";
import cors from "cors";
import orderRoutes from "./routes/Orders.routes.ts"
import orderItemRoutes from "./routes/OrderItems.routes.ts"
import billSplitRoutes from "./routes/BillSplits.routes.ts"
import paymentRoutes from "./routes/Payment.routes.ts"
import authRoutes from "./routes/Auth.routes.ts"
import dinningSessionRoutes from './routes/DiningSession.routes.ts'
import groupRoutes from './routes/Group.routes.ts'
import groupMemRoutes from './routes/GroupMembers.routes.ts'
import session from "express-session";

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// Routes
app.use("/orders", orderRoutes);
app.use("/order-items", orderItemRoutes);
app.use("/bill-splits", billSplitRoutes);
app.use("/payments", paymentRoutes);
app.use("/auth", authRoutes)
app.use('/dining_session', dinningSessionRoutes)
app.use('/group', groupRoutes)
app.use('/group_members', groupMemRoutes)

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: "user" | "admin";
    email?: string;
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});

export default app;
