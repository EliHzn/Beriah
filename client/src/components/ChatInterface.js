import React, { useState } from 'react';
import axios from 'axios';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Send message to either ChatGPT or Grok
  const handleSend = async (model) => {
    if (!inputText.trim()) return;
    const userMessage = inputText.trim();

    // Display user message in UI
    const newMessages = [
      ...messages,
      { sender: 'user', text: userMessage }
    ];
    setMessages(newMessages);
    setInputText('');

    try {
      // Decide which endpoint to call
      const endpoint = model === 'chatgpt' ? '/api/chatgpt' : '/api/grok';
      const res = await axios.post(endpoint, { message: userMessage });
      const aiReply = res.data.reply || '(No response)';

      // Display AI message in UI
      setMessages(prev => [
        ...prev,
        { sender: model, text: aiReply }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { sender: model, text: '(Error retrieving AI response)' }
      ]);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md p-4 rounded-md w-full max-w-2xl flex flex-col h-[80vh] border border-white/20">
      {/* Title / Header */}
      <div className="text-center text-xl font-bold mb-2">
        Beriah Futuristic Chat
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto mb-3 p-2 border border-white/20 rounded-md">
        {messages.map((msg, idx) => {
          let bubbleColor = 'bg-blue-600';   // default
          if (msg.sender === 'chatgpt') bubbleColor = 'bg-green-600';
          if (msg.sender === 'grok') bubbleColor = 'bg-purple-600';
          if (msg.sender === 'user') bubbleColor = 'bg-gray-600';

          return (
            <div key={idx} className={`my-2 max-w-[80%] px-3 py-2 rounded-lg text-white ${msg.sender === 'user' ? 'ml-auto' : 'mr-auto'} ${bubbleColor}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          );
        })}
      </div>

      {/* Input + Buttons */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-md text-black"
          type="text"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // default to ChatGPT on enter (optional)
              handleSend('chatgpt');
            }
          }}
        />
        <button
          onClick={() => handleSend('chatgpt')}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md"
        >
          Send to ChatGPT
        </button>
        <button
          onClick={() => handleSend('grok')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md"
        >
          Send to Grok
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
