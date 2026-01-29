// controllers/chatController.js
import axios from 'axios';
import Chat from '../models/Chat.js';
import dotenv from 'dotenv';


dotenv.config();

export const createChat = async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.userId,
      // title: 'New Chat' ← already default in schema
    });

    await chat.save();

    return res.status(201).json({
      chatId: chat._id,
      title: chat.title,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({
      error: 'Failed to create new chat',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get all chats belonging to the authenticated user
 */
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean(); // faster when we don't need mongoose documents

    return res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

/**
 * Get a single chat by ID (only if it belongs to the user)
 */
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.userId,
    }).lean();

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    return res.json(chat);
  } catch (error) {
    console.error('Error loading chat:', error);
    return res.status(500).json({ error: 'Failed to load chat' });
  }
};


export const sendMessage = async (req, res) => {
  const { message, chatId , hf_token} = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!chatId) {
    return res.status(400).json({ error: 'chatId is required' });
  }

  try {
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const pythonResponse = await axios.post(
      process.env.FLASK_CHAT_URL || 'http://localhost:5000/chat',
      {
        message: message.trim(),
        session_id: chatId.toString(),
        hf_token: hf_token || undefined,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const aiResponse = pythonResponse.data?.response;
    if (!aiResponse) {
      throw new Error('No valid response from AI service');
    }

    // Save user message
    chat.messages.push({
      role: 'user',
      content: message.trim(),
    });

    // Save AI message
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
    });

    // Auto-generate title from first user message if still default
    if (chat.title === 'New Chat' && chat.messages.length > 0) {
      const firstUserMessage = chat.messages.find(m => m.role === 'user')?.content || '';
      if (firstUserMessage) {
        chat.title = firstUserMessage
          .substring(0, 60)
          .trim()
          .replace(/\s+/g, ' ') || 'New Conversation';
      }
    }

    await chat.save();

    return res.json({ response: aiResponse });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: status === 500
        ? 'AI service unavailable. Try again later.'
        : error.message || 'Failed to process message',
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('deleteChat error:', error);
    return res.status(500).json({ error: 'Failed to delete chat' });
  }
};