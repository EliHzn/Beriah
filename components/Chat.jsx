// src/components/Chat.jsx

import React from "react";
import "./Chat.css";

function Chat() {
  return (
    <div className="chat">
      <div className="chat__header">
        <h2>Chat Header</h2>
      </div>
      <div className="chat__body">
        <p className="chat__message">
          This is a sample message
          <span className="chat__timestamp">3:52 PM</span>
        </p>
        <p className="chat__message chat__receiver">
          This is another message
          <span className="chat__timestamp">3:53 PM</span>
        </p>
      </div>
      <div className="chat__footer">
        <input placeholder="Type a message..." />
        <button>Send</button>
      </div>
    </div>
  );
}

export default Chat;
