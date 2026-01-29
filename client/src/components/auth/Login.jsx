// src/pages/Login.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaUser, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { NODE_API } from '../../../api';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Invalid email format';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`${NODE_API}/auth/login`, {
        email,
        password,
      });

      sessionStorage.setItem('email', email);
      window.dispatchEvent(new Event('authChanged'));
      navigate('/chat');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Login failed. Check your credentials.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-indigo-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="
          relative w-full max-w-md
          bg-gray-900/70 backdrop-blur-xl border border-blue-800/40
          rounded-3xl shadow-2xl shadow-black/70 p-8 md:p-10
        "
      >
        <h1 className="
          text-4xl md:text-5xl font-extrabold mb-10 text-center
          bg-gradient-to-r from-blue-400 via-purple-500 to-red-500
          bg-clip-text text-transparent tracking-tight
        ">
          LOGIN
        </h1>

        {errors.form && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-500/40 rounded-xl text-red-300 text-center font-medium shadow-inner">
            ⚠️ {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Email */}
          <div>
            <label className="block text-lg font-medium mb-2 text-blue-300">
              Email
            </label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/70 text-xl" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="
                  w-full pl-12 pr-4 py-4 bg-gray-800/70 border-2 border-blue-800/50 rounded-xl
                  text-white placeholder-gray-500 text-base md:text-lg
                  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/50
                  transition-all duration-300 shadow-inner
                "
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-lg font-medium mb-2 text-blue-300">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/70 text-xl" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="
                  w-full pl-12 pr-12 py-4 bg-gray-800/70 border-2 border-blue-800/50 rounded-xl
                  text-white placeholder-gray-500 text-base md:text-lg
                  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/50
                  transition-all duration-300 shadow-inner
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className=" cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="
              w-full py-4 px-6 rounded-xl font-bold text-lg tracking-wide cursor-pointer
              bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700
              hover:from-blue-600 hover:via-blue-500 hover:to-indigo-600
              text-white shadow-lg shadow-blue-900/40
              transition-all duration-300 transform hover:scale-[1.02] hover:shadow-blue-700/50
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-400 hover:text-blue-300 font-medium underline transition cursor-pointer"
          >
            Register
          </button>
        </p>
      </motion.div>
    </div>
  );
}