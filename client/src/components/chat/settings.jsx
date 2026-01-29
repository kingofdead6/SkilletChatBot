// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [hfToken, setHfToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('hf_api_token');
    if (savedToken) {
      setHfToken(savedToken);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!hfToken.trim()) {
      setError('Please enter a valid Hugging Face API token');
      return;
    }

    localStorage.setItem('hf_api_token', hfToken.trim());
    setSaved(true);

    // Auto-redirect after success
    setTimeout(() => navigate('/chat'), 1400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-indigo-950 flex items-center justify-center px-4 py-10">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="
        relative w-full max-w-lg
        bg-gray-900/70 backdrop-blur-xl border border-blue-800/40
        rounded-3xl shadow-2xl shadow-black/70 p-8 md:p-10
      ">
        <h1 className="
          text-4xl md:text-5xl font-extrabold mb-10 text-center
          bg-gradient-to-r from-blue-400 via-purple-500 to-red-500
          bg-clip-text text-transparent tracking-tight
        ">
          SETTINGS
        </h1>

        <form onSubmit={handleSave} className="space-y-8">
          <div>
            <label className="block text-lg font-medium mb-3 text-blue-300">
              Hugging Face API Token
            </label>
            <input
              type="text"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="
                w-full px-5 py-4 bg-gray-800/70 border-2 border-blue-800/60 rounded-xl
                text-white placeholder-gray-500 text-base md:text-lg
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600/50
                transition-all duration-300 shadow-inner
              "
            />
            <p className="mt-3 text-sm text-gray-400">
              Get your token here:{' '}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition"
              >
                huggingface.co/settings/tokens
              </a>
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-center font-medium py-2 tracking-wide">
              ⚠️ {error}
            </p>
          )}

          {saved && (
            <p className="text-green-400 text-center font-medium py-2 animate-pulse">
              Token saved! Redirecting...
            </p>
          )}

          <button
            type="submit"
            className="
              w-full py-4 px-6 rounded-xl font-bold text-lg tracking-wide cursor-pointer 
              bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700
              hover:from-blue-600 hover:via-blue-500 hover:to-indigo-600
              text-white shadow-lg shadow-blue-900/40
              transition-all duration-300 transform hover:scale-[1.02] hover:shadow-blue-700/50
            "
          >
            SAVE TOKEN
          </button>
        </form>

        <button
          onClick={() => navigate('/chat')}
          className="
            w-full mt-8 text-blue-400 hover:text-blue-300 cursor-pointer 
            text-center font-medium transition py-3
          "
        >
          ← Back to Chat
        </button>
      </div>
    </div>
  );
}