// client/src/components/MediaButton.js
import React, { useState } from 'react';
import axios from 'axios';

function MediaButton({ projectId, onNewMedia }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/conversations/${projectId}/media`, { prompt });
      onNewMedia(res.data); // { id, prompt, url }
      setPrompt('');
    } catch (err) {
      console.error('Error generating media:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        className="border rounded px-2 py-1 text-sm flex-1"
        placeholder="Generate an image..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Media'}
      </button>
    </div>
  );
}

export default MediaButton;
