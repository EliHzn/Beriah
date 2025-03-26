// client/src/components/ScaffoldPanel.js
import React, { useState } from 'react';
import axios from 'axios';

function ScaffoldPanel({ projectId }) {
  const [scaffoldStatus, setScaffoldStatus] = useState('');
  const [files, setFiles] = useState([]);
  const [diff, setDiff] = useState('');
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [operationStatus, setOperationStatus] = useState('');

  const handleScaffold = async () => {
    setScaffoldStatus('Generating scaffold...');
    try {
      const res = await axios.post(`/api/conversations/${projectId}/scaffold`);
      setFiles(res.data.files || []);
      setScaffoldStatus('Scaffold generated successfully!');
    } catch (err) {
      console.error('Scaffold error:', err);
      setScaffoldStatus(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handlePreview = async () => {
    setOperationStatus('Generating diff...');
    try {
      const res = await axios.get(`/api/conversations/${projectId}/preview`);
      setDiff(res.data.diff);
      setOperationStatus('Diff loaded.');
    } catch (err) {
      console.error('Preview error:', err);
      setOperationStatus(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCommit = async (push = false) => {
    setOperationStatus(push ? 'Committing & pushing...' : 'Committing...');
    try {
      const res = await axios.post(`/api/conversations/${projectId}/commit`, {
        commitMessage,
        push
      });
      setOperationStatus(res.data.message);
    } catch (err) {
      console.error('Commit error:', err);
      setOperationStatus(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeploy = async () => {
    setOperationStatus('Deploying to Firebase...');
    try {
      const res = await axios.post(`/api/conversations/${projectId}/deploy`);
      setOperationStatus(`Deploy output: ${res.data.output}`);
    } catch (err) {
      console.error('Deploy error:', err);
      setOperationStatus(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="p-3 border rounded-md text-sm space-y-3">
      <h2 className="text-lg font-bold mb-2">Scaffold, Preview, Commit, Deploy</h2>
      
      {/* Generate Scaffold */}
      <button
        onClick={handleScaffold}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
      >
        Generate Scaffold
      </button>
      <p>{scaffoldStatus}</p>
      {files.length > 0 && (
        <div>
          <h3 className="font-bold">Created Files:</h3>
          <ul className="list-disc list-inside">
            {files.map((f, idx) => <li key={idx}>{f.path}</li>)}
          </ul>
        </div>
      )}

      <hr />

      {/* Preview */}
      <button
        onClick={handlePreview}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
      >
        Preview Changes (Diff)
      </button>
      {operationStatus && <p className="mt-2">{operationStatus}</p>}
      {diff && (
        <pre className="mt-2 p-2 bg-gray-200 text-xs overflow-auto max-h-60">
          {diff}
        </pre>
      )}

      <hr />

      {/* Commit message input */}
      <label className="block font-bold mt-2">Commit Message:</label>
      <input
        className="border rounded px-2 py-1 w-full"
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
      />
      <div className="space-x-2 mt-2">
        <button
          onClick={() => handleCommit(false)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        >
          Commit Locally
        </button>
        <button
          onClick={() => handleCommit(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        >
          Commit & Push
        </button>
      </div>

      <hr />

      <button
        onClick={handleDeploy}
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded mt-2"
      >
        Deploy to Firebase
      </button>
    </div>
  );
}

export default ScaffoldPanel;
