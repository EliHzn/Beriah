// client/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        {/* Left side: Sidebar for project management */}
        <Sidebar />

        {/* Right side: The main content area (ChatWindow or placeholder) */}
        <div className="flex-1">
          <Routes>
            {/* Default route: instruct user to pick/create a project */}
            <Route
              path="/"
              element={
                <div className="p-4 text-gray-700">
                  <h2 className="text-lg font-bold">Select or create a project</h2>
                </div>
              }
            />
            {/* Project route: Chat page for a specific project */}
            <Route path="/project/:projectId" element={<ChatWindow />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
