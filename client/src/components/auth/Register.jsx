// src/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NODE_API } from '../../../api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${NODE_API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        navigate('/chat');
      } else {
        setError(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
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

      <div className="
        relative w-full max-w-md
        bg-gray-900/70 backdrop-blur-xl border border-blue-800/40
        rounded-3xl shadow-2xl shadow-black/70 p-8 md:p-10
      ">
        <h1 className="
          text-4xl md:text-5xl font-extrabold mb-10 text-center
          bg-gradient-to-r from-blue-400 via-purple-500 to-red-500
          bg-clip-text text-transparent tracking-tight
        ">
          CREATE ACCOUNT
        </h1>

        {error && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-500/40 rounded-xl text-red-300 text-center font-medium shadow-inner">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-7">
          {/* Name */}
          <div>
            <label className="block text-lg font-medium mb-2 text-blue-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="
                w-full px-5 py-4 bg-gray-800/70 border-2 border-blue-800/50 rounded-xl
                text-white placeholder-gray-500 text-base md:text-lg
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/50
                transition-all duration-300 shadow-inner
              "
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-lg font-medium mb-2 text-blue-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="
                w-full px-5 py-4 bg-gray-800/70 border-2 border-blue-800/50 rounded-xl
                text-white placeholder-gray-500 text-base md:text-lg
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/50
                transition-all duration-300 shadow-inner
              "
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-lg font-medium mb-2 text-blue-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                  w-full px-5 py-4 pr-12 bg-gray-800/70 border-2 border-blue-800/50 rounded-xl
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
                {showPassword ? (
                  <span className="text-xl">🙈</span>
                ) : (
                  <span className="text-xl">👁️</span>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-4 px-6 rounded-xl font-bold text-lg tracking-wide cursor-pointer
              bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700
              hover:from-blue-600 hover:via-blue-500 hover:to-indigo-600
              text-white shadow-lg shadow-blue-900/40
              transition-all duration-300 transform hover:scale-[1.02] hover:shadow-blue-700/50
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? 'Creating Account...' : 'REGISTER'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 font-medium underline transition cursor-pointer "
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}