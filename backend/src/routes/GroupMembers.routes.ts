import { Router } from "express";
import { addMembers, deleteAllMembers, deleteAutoCreatedMembers, deleteMember, getGroupMembers, getMembersBySession } from "src/controllers/GroupMembers.controllers.js";

const router = Router()

router.post('/add', addMembers)
router.delete('/:groupId', deleteAllMembers)
router.delete('/member/:memberId', deleteMember); 
router.get('/:groupId', getGroupMembers)
router.get('/by-session/:sessionId', getMembersBySession);
router.delete('/sessions/:sessionId/auto-created', deleteAutoCreatedMembers);

export default router