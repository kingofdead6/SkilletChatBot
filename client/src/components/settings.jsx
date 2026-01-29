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

    // Save to localStorage
    localStorage.setItem('hf_api_token', hfToken.trim());
    setSaved(true);

    // Optional: redirect back to chat after save
    setTimeout(() => navigate('/chat'), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-light mb-8 text-center">Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Hugging Face API Token
            </label>
            <input
              type="text"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="mt-2 text-xs text-gray-500">
              Get your token at:{' '}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                huggingface.co/settings/tokens
              </a>
            </p>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {saved && (
            <p className="text-green-400 text-sm text-center">
              Token saved! Redirecting to chat...
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition"
          >
            Save API Token
          </button>
        </form>

        <button
          onClick={() => navigate('/chat')}
          className="w-full mt-6 text-gray-400 hover:text-white text-center"
        >
          ← Back to Chat
        </button>
      </div>
    </div>
  );
}