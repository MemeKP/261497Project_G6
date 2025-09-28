import { Router } from "express";
import { endSession, getActiveSession, getSession, startSession } from "src/controllers/DiningSession.controllers.js";
import { requireAdmin } from "src/middleware/Requireadmin.js";

const router = Router()

router.post('/start', requireAdmin, startSession)
router.post('/end', requireAdmin, endSession)
router.get('/active', requireAdmin, getActiveSession)
router.get('/:sessionId', getSession)

export default router