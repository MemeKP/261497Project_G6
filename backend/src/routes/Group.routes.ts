import { Router } from "express";
import { createGroup } from "src/controllers/Group.controllers.js";

const router = Router()

router.post('/create', createGroup)

export default router