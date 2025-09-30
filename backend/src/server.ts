import express from "express";
import cors from "cors";
import orderRoutes from "./routes/Orders.routes.ts";
import orderItemRoutes from "./routes/OrderItems.routes.ts";
import billSplitRoutes from "./routes/BillSplits.routes.ts";
import paymentRoutes from "./routes/Payment.routes.ts";
import authRoutes from "./routes/Auth.routes.ts";
import dinningSessionRoutes from "./routes/DiningSession.routes.ts";
import groupRoutes from "./routes/Group.routes.ts";
import groupMemRoutes from "./routes/GroupMembers.routes.ts";
import menuRoutes from './routes/Menu.routes.ts'
import session from "express-session";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,  // origin ของ frontend
    credentials: true,                // ให้ส่ง cookie ได้
  })
);
app.use(express.json());

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

// allow cross-origin requests
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Routes
app.use("/orders", orderRoutes);
app.use("/order-items", orderItemRoutes);
app.use("/bill-splits", billSplitRoutes);
app.use("/payments", paymentRoutes);
app.use("/auth", authRoutes);
app.use("/dining_session", dinningSessionRoutes);
app.use("/group", groupRoutes);
app.use("/group_members", groupMemRoutes);
app.use('/menu_items', menuRoutes)

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: "user" | "admin";
    email?: string;
  }
}

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
