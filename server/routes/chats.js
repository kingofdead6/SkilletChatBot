import express from 'express';
import {
  createChat,
  getChats,
  getChat,
  sendMessage,
  deleteChat,     // ← new
} from '../controllers/chatController.js';
import { authByEmail } from '../middleware/auth.js';  // make sure path is correct

const router = express.Router();

router.post('/new',         authByEmail, createChat);
router.get('/', authByEmail, getChats);
router.get('/:chatId',      authByEmail, getChat);
router.post('/message',     authByEmail, sendMessage);     // ← new
router.delete('/:chatId',   authByEmail, deleteChat);      // ← new

export default router;