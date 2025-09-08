import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import morgan from "morgan";
import { dbClient } from "@db/client.js";
import { usersTable, diningSessionsTable } from "@db/schema.js";
import { eq, and } from "drizzle-orm";

const app = express();

// ===================== Middleware =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// ===================== Passport =====================
passport.use(new LocalStrategy({ usernameField: "email", passwordField: "password" }, 
async (email: string, password: string, done) => {
  try {
    const user = await dbClient.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (!user) return done(null, false, { message: "No email exists" });
    const valid = await bcrypt.compare(password, user.password);
    if (valid) return done(null, user);
    return done(null, false, { message: "Incorrect password" });
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await dbClient.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ===================== Auth Middleware =====================
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Authentication required" });
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated() && (req.user as any)?.isAdmin) return next();
  res.status(403).json({ error: "Admin access required" });
};

// ===================== Helpers =====================
async function createUser(name: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await dbClient.insert(usersTable).values({
    name,
    email,
    password: hashedPassword,
    isAdmin: false
  }).returning({ id: usersTable.id });
  return result[0];
}

// ===================== Routes =====================
app.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await dbClient.query.usersTable.findMany();

    const usersSafe = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    res.json(usersSafe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// --- Auth ---
app.get("/auth", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

app.post("/auth/register", async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;
  if (!name || !email || !password || !passwordConfirm)
    return res.status(400).json({ error: "All fields required" });
  if (password !== passwordConfirm)
    return res.status(400).json({ error: "Passwords do not match" });

  const existing = await dbClient.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const user = await createUser(name, email, password);
  res.status(201).json({ message: "User registered", userId: user.id });
});

app.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) return res.status(500).json({ error: "Login error" });
    if (!user) return res.status(401).json({ error: info?.message || "Login failed" });
    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: "Login error" });
      const { password, ...userSafe } = user;
      res.json({ message: "Login successful", user: userSafe });
    });
  })(req, res, next);
});

// --- Dining Session ---
app.post("/dining_session/start", requireAuth, requireAdmin, async (req, res) => {
  const { tableId } = req.body;
  if (!tableId) return res.status(400).json({ error: "tableId required" });

  const existing = await dbClient.query.diningSessionsTable.findFirst({
    where: and(eq(diningSessionsTable.tableId, tableId), eq(diningSessionsTable.status, "ACTIVE"))
  });
  if (existing) return res.status(400).json({ error: "Table already active" });

  const session = await dbClient.insert(diningSessionsTable).values({
    tableId: parseInt(tableId),
    status: "ACTIVE",
    totalCustomers: 0
  }).returning();

  res.status(201).json({ message: "Dining session started", session: session[0] });
});

app.put("/dining_session/:tableId/customers", requireAuth, requireAdmin, async (req, res) => {
  const { tableId } = req.params;
  const { totalCustomers } = req.body;
  if (!totalCustomers || totalCustomers < 1)
    return res.status(400).json({ error: "totalCustomers required" });

  const updated = await dbClient.update(diningSessionsTable)
    .set({ totalCustomers: parseInt(totalCustomers) })
    .where(and(eq(diningSessionsTable.tableId, parseInt(tableId)), eq(diningSessionsTable.status, "ACTIVE")))
    .returning();

  if (!updated.length) return res.status(404).json({ error: "No active session" });
  res.json({ message: "Updated customers", session: updated[0] });
});

app.post("/dining_session/:tableId/end", requireAuth, requireAdmin, async (req, res) => {
  const { tableId } = req.params;

  const ended = await dbClient.update(diningSessionsTable)
    .set({ status: "COMPLETED", endedAt: new Date() })
    .where(and(eq(diningSessionsTable.tableId, parseInt(tableId)), eq(diningSessionsTable.status, "ACTIVE")))
    .returning();

  if (!ended.length) return res.status(404).json({ error: "No active session" });
  res.json({ message: "Dining session ended", session: ended[0] });
});

// ===================== Start Server =====================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
