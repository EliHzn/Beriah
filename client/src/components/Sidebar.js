// client/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  const [projects, setProjects] = useState([]);
  const [ideaInput, setIdeaInput] = useState('');

  // For the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // On mount, fetch the project list from the server
  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      // You need a GET /api/conversations route on the server that returns
      // an array of { projectId, name } objects for all existing projects
      const res = await axios.get('/api/conversations');
      setProjects(res.data); // assume data is an array
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }

  // Create a new project on the server
  async function handleCreateProject() {
    if (!ideaInput.trim()) return;

    try {
      // POST /api/conversations with { idea: ideaInput }
      const res = await axios.post('/api/conversations', { idea: ideaInput.trim() });
      // The server returns { projectId, name, ... } for the new conversation
      const { projectId, name } = res.data;

      if (!projectId) {
        console.error('No projectId returned from server:', res.data);
        return;
      }

      // Update local state
      setProjects((prev) => [...prev, { projectId, name }]);
      setIdeaInput('');

      // Navigate to the newly created project
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error('Error creating project:', err);
    }
  }

  // Open the delete modal
  function openDeleteModal(proj) {
    setProjectToDelete(proj);
    setShowDeleteModal(true);
  }

  // Confirm deletion => call DELETE on the server, then remove from local state
  async function confirmDelete() {
    if (!projectToDelete) return;

    try {
      // DELETE /api/conversations/:projectId
      await axios.delete(`/api/conversations/${projectToDelete.projectId}`);

      // Remove from local list
      setProjects((prev) => prev.filter((p) => p.projectId !== projectToDelete.projectId));
      setProjectToDelete(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  }

  // Cancel deletion
  function cancelDelete() {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  }

  return (
    <div className="w-64 bg-white border-r border-gray-300 flex flex-col relative">
      {/* Header */}
      <div className="p-3 border-b border-gray-300">
        <h2 className="text-xl font-bold text-center">Beriah Projects</h2>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((proj) => (
          <div
            key={proj.projectId}
            className={`px-3 py-2 text-sm hover:bg-gray-200 flex items-center justify-between ${
              location.pathname.includes(proj.projectId) ? 'bg-gray-200' : ''
            }`}
          >
            <Link to={`/project/${proj.projectId}`} className="flex-1 truncate pr-2">
              {proj.name || `Project-${proj.projectId.slice(0,5)}`}
            </Link>
            {/* Delete button */}
            <button
              className="text-red-500 hover:text-red-600"
              onClick={() => openDeleteModal(proj)}
            >
              {/* Trash icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 10v10m0 0c0 1.105.895 2 
                     2 2h8c1.105 0 2-.895 2-2V10
                     m-9 0v10m6-10v10M5 6h14m-4-2v2m-6-2v2"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Create Project */}
      <div className="p-3 border-t border-gray-300">
        <input
          type="text"
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          placeholder="Enter app idea..."
          className="w-full mb-2 px-3 py-2 rounded-md border text-sm"
        />
        <button
          onClick={handleCreateProject}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm"
        >
          Create New Project
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-4 rounded-md">
            <h2 className="text-lg font-bold mb-3">Confirm Deletion</h2>
            <p>
              Are you sure you want to delete{' '}
              <strong>{projectToDelete?.name}</strong>?
            </p>
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={cancelDelete}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
