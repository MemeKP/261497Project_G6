import { Router } from "express";
import { createGroup,getGroupBySession } from "src/controllers/Group.controllers.js";

const router = Router()

router.post('/create', createGroup)
router.get("/session/:sessionId", getGroupBySession)

export default router