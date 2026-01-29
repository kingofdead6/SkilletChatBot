import User from '../models/User.js';

export const authByEmail = async (req, res, next) => {
  const email = req.headers['x-user-email'];

  if (!email) {
    return res.status(401).json({ error: 'Authentication required: x-user-email header missing' });
  }

  try {
    const user = await User.findOne({ email }).select('_id email name');

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication server error' });
  }
};