import axios from 'axios';
import Chat from '../models/Chat.js';

export const createChat = async (req, res) => {
  try {
    console.log('userId:', req.userId);

    const chat = new Chat({ userId: req.userId });
    await chat.save();

    res.json({ chatId: chat._id, title: chat.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat' });
  }
};

export const sendMessage = async (req, res) => {
  const { message, chatId } = req.body;
  if (!message || !chatId) return res.status(400).json({ error: 'Missing message or chatId' });

  try {
    const chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Forward to your Python Flask backend
    const flaskRes = await axios.post(process.env.FLASK_CHAT_URL, {
      message,
      session_id: chatId.toString()  // reuse chatId as session_id in Flask
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiResponse = flaskRes.data.response;

    // Save messages
    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.json({ response: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
};