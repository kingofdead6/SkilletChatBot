import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import dotenv from 'dotenv';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Node server running on port ${PORT}`));