import React from 'react';

function ChatMessage({ message }) {
  const { role, content, ai } = message;

  let bubbleClass = '';
  let containerClass = '';
  let label = '';

  if (role === 'user') {
    containerClass = 'justify-end';
    bubbleClass = 'bg-green-300 text-black rounded-br-none'; 
    label = 'You';
  } else if (role === 'assistant-internal') {
    containerClass = 'justify-center';
    bubbleClass = 'bg-gray-200 text-black text-sm italic';
    label = ai || 'AI internal';
  } else if (role === 'assistant') {
    containerClass = 'justify-start';
    bubbleClass = 'bg-white text-black rounded-bl-none'; 
    label = ai || 'Assistant';
  } else if (role === 'system') {
    containerClass = 'justify-center';
    bubbleClass = 'bg-blue-200 text-black text-xs';
    label = 'System';
  }

  return (
    <div className={`flex ${containerClass} mb-2`}>
      <div className={`max-w-xs md:max-w-md p-2 rounded-lg ${bubbleClass}`}>
        <div className="font-bold text-xs mb-1">{label}</div>
        <div className="whitespace-pre-wrap text-sm">{content}</div>
      </div>
    </div>
  );
}

export default ChatMessage;
