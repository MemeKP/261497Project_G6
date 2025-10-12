import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "src/controllers/Auth.controllers.js";
import { requireAuth } from "src/middleware/RequireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getCurrentUser);

export default router;