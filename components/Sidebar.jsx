// src/components/Sidebar.jsx

import React from "react";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <h2>Sidebar Header</h2>
      </div>
      <div className="sidebar__chatList">
        <div className="sidebar__chatItem">Sample Chat #1</div>
        <div className="sidebar__chatItem">Sample Chat #2</div>
      </div>
    </div>
  );
}

export default Sidebar;
