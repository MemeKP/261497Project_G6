import { Router } from "express";
import { getTablesWithSessionStatus, getTables } from "src/controllers/Table.controllers.js";

const router = Router();

router.get('/session-status', getTablesWithSessionStatus)
router.get('/', getTables);

export default router;

