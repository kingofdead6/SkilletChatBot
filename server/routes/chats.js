import express from 'express';
import { createChat, getChats, getChat, sendMessage } from '../controllers/chatController.js';
import {authMiddleware} from '../middleware/auth.js'
const router = express.Router();

router.post('/new', authMiddleware, createChat);
router.get('/', authMiddleware, getChats);
router.get('/:chatId', authMiddleware, getChat);
router.post('/', authMiddleware, sendMessage);


export default router;