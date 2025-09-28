import { Router } from "express";
import { addMembers, deleteMembers, getGroupMembers } from "src/controllers/GroupMembers.controllers.js";

const router = Router()

router.post('/add', addMembers)
router.delete('/:groupId', deleteMembers)
router.get('/:groupId', getGroupMembers)

export default router