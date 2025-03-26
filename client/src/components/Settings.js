import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Settings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ specialInstructions: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`/api/conversations/${projectId}`);
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    }
    fetchData();
  }, [projectId]);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.post(`/api/conversations/${projectId}/settings`, settings);
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-lg font-bold">Settings for {projectId}</h2>
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
        >
          Back to Chat
        </button>
      </div>
      <div className="p-3 space-y-4">
        <div>
          <label className="block mb-1 text-sm font-bold">Special Instructions</label>
          <textarea
            name="specialInstructions"
            value={settings.specialInstructions || ''}
            onChange={handleChange}
            rows="5"
            className="w-full p-2 rounded border text-sm"
            placeholder="Any additional style, tone, or constraints..."
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default Settings;
