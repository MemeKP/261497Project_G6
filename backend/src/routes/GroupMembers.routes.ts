import { Router } from "express";
import { addMembers, deleteAllMembers, deleteMember, getGroupMembers } from "src/controllers/GroupMembers.controllers.js";

const router = Router()

router.post('/add', addMembers)
router.delete('/:groupId', deleteAllMembers)
router.delete('/member/:memberId', deleteMember); 
router.get('/:groupId', getGroupMembers)

export default router