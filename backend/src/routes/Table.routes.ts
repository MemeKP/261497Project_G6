import { Router } from "express";
import { getTablesWithSessionStatus } from "src/controllers/Table.controllers.js";

const router = Router();

router.get('/session-status', getTablesWithSessionStatus)

export default router;