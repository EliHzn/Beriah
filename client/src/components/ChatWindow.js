// client/src/components/ChatWindow.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

/** Format ISO string to local date/time */
function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

/** Parse messages for bullet lines, bold lines referencing "phase," etc. */
function parseMessageText(content) {
  let text = content.split('\n').map((line) => {
    const lower = line.trim().toLowerCase();
    if (lower.includes('are you ready') || lower.includes('phase ')) {
      return `**${line}**`;
    }
    return line;
  }).join('\n');

  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((para, pIdx) => {
    const lines = para.split('\n').map((ln, lIdx) => lineParser(ln, `p-${pIdx}-l-${lIdx}`));
    return { key: `p-${pIdx}`, lines };
  });
}

function lineParser(line, key) {
  const trimmed = line.trim();
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return { type: 'bullet', text: trimmed.replace(/^(-|\*)\s+/, ''), key };
  }
  return { type: 'text', text: line, key };
}

function renderBoldSegments(str) {
  return str.split('**').map((chunk, i) => {
    if (i % 2 === 1) return <strong key={i}>{chunk}</strong>;
    return <span key={i}>{chunk}</span>;
  });
}

function renderParsedContent(parsed) {
  return parsed.map((para) => (
    <div key={para.key} className="mb-2">
      {para.lines.map((line) => {
        if (line.type === 'bullet') {
          return (
            <div key={line.key} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{renderBoldSegments(line.text)}</span>
            </div>
          );
        }
        return <div key={line.key}>{renderBoldSegments(line.text)}</div>;
      })}
    </div>
  ));
}

/** The triple-dot iPhone typing bubble */
function TypingBubble() {
  return (
    <div className="flex justify-start my-1 mx-4">
      <div className="p-2 bg-white text-black max-w-[70%] rounded-r-2xl rounded-bl-2xl shadow-sm relative">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce200"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce400"></div>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const { projectId } = useParams();

  const [conversation, setConversation] = useState(null);
  const [inputText, setInputText] = useState('');

  const [loadingAI, setLoadingAI] = useState(false);
  const [simulatedMsg, setSimulatedMsg] = useState('');

  // For "Stop" (abort requests)
  const [abortController, setAbortController] = useState(null);

  // synergy progress
  const [progressSteps, setProgressSteps] = useState([]);

  // If synergy suggests possible answers
  const [suggestedAnswers, setSuggestedAnswers] = useState([]);

  // Keep track of "Delivered" status for user messages
  const [deliveryStatus, setDeliveryStatus] = useState({});

  // For toggling an emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // The emoji array (was previously unused, now we’ll incorporate it)
  const EMOJIS = ['😀','🎉','❤️','🔥','🤔','😂','😎','🥳','🚀','👍'];

  const simulateIndexRef = useRef(0);

  // Load conversation from server
  const loadConversation = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(`/api/conversations/${projectId}`);
      setConversation(res.data);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  }, [projectId]);

  // Run once or whenever projectId changes
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /** We parse SUGGESTED_ANSWERS: - option lines */
  function parseSuggestedAnswers(text) {
    const match = text.match(/SUGGESTED_ANSWERS:\s*((?:- .*\n?)+)/i);
    if (!match) return [];
    return match[1].split('\n').map(l => l.trim()).filter(Boolean).map(l => l.replace(/^-\s*/, ''));
  }

  /** Send user message or custom message (like a suggested reply) */
  async function handleSend(customMsg) {
    const userMsg = customMsg !== undefined ? customMsg : inputText.trim();
    if (!userMsg) return;

    setInputText('');
    setSuggestedAnswers([]);
    setLoadingAI(true);
    setSimulatedMsg('');
    setProgressSteps([]);

    // Add user bubble
    setConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, {
          role: 'user',
          content: userMsg,
          timestamp: new Date().toISOString()
        }]
      };
    });

    // Mark as delivered after short delay
    setTimeout(() => {
      setDeliveryStatus(prev => ({ ...prev, [userMsg]: 'Delivered' }));
    }, 500);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await axios.post(
        `/api/conversations/${projectId}/message`,
        { message: userMsg },
        { signal: controller.signal }
      );

      if (res.data.aborted) {
        // synergy was aborted
        setLoadingAI(false);
        setAbortController(null);
        return;
      }

      const { messages, stepsLog, finalText } = res.data;
      if (stepsLog) setProgressSteps(stepsLog);

      const updatedMsgs = messages || [];
      const lastMsg = updatedMsgs[updatedMsgs.length - 1];

      setConversation(prev => ({ ...prev, messages: updatedMsgs }));

      if (lastMsg && lastMsg.role === 'assistant') {
        // typed-out approach
        setConversation(prev => ({
          ...prev,
          messages: updatedMsgs.slice(0, -1)
        }));
        simulateAIMessage(lastMsg.content, lastMsg.ai);
      } else {
        setLoadingAI(false);
        setAbortController(null);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled by user');
      } else {
        console.error('Send error:', err);
      }
      setLoadingAI(false);
      setAbortController(null);
    }
  }

  /** Stop the synergy chain request */
  function handleStop() {
    if (abortController) {
      abortController.abort();
    }
  }

  /** AI typed-out final message simulation */
  function simulateAIMessage(text, aiName) {
    setSimulatedMsg('');
    simulateIndexRef.current = 0;
    let typed = '';

    function step() {
      typed += text.charAt(simulateIndexRef.current);
      setSimulatedMsg(typed);
      simulateIndexRef.current++;
      if (simulateIndexRef.current < text.length) {
        setTimeout(step, 15);
      } else {
        // done
        setConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, {
              role: 'assistant',
              content: typed,
              ai: aiName,
              timestamp: new Date().toISOString()
            }]
          };
        });
        setLoadingAI(false);
        setAbortController(null);

        const suggestions = parseSuggestedAnswers(text);
        if (suggestions.length > 0) {
          setSuggestedAnswers(suggestions);
        }
      }
    }
    step();
  }

  /** Insert an emoji into input text */
  function handleEmojiClick(emo) {
    setInputText(prev => prev + emo);
    setShowEmojiPicker(false);
  }

  /** If conversation not loaded yet */
  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="p-3 border-b border-gray-300">
          <h2 className="text-lg font-bold">Loading...</h2>
        </div>
        <div className="flex-1 p-4">Please wait...</div>
      </div>
    );
  }

  // partial typed AI message
  const partialParsed = parseMessageText(simulatedMsg);

  // synergy progress ratio
  const maxSteps = 25;
  const ratio = (progressSteps.length / maxSteps) * 100;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-300">
        <h2 className="text-lg font-bold">iPhone Messages: {conversation.name} 🍏</h2>
      </div>

      {loadingAI && (
        <div className="bg-gray-300 h-2">
          <div
            className="bg-blue-600 h-2 transition-all"
            style={{ width: `${Math.min(ratio, 100)}%` }}
          />
        </div>
      )}
      {loadingAI && progressSteps.length > 0 && (
        <div className="px-3 py-1 text-xs text-gray-600">
          {progressSteps.map((st, i) => <div key={i}>• {st}</div>)}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {conversation.messages.map((msg, idx) => {
          const isUser = (msg.role === 'user');
          const isAssistant = (msg.role === 'assistant');  // used to avoid ESLint

          const isInternal = (msg.role === 'assistant-internal');
          const isSystem = (msg.role === 'system');

          let alignment = 'justify-start';
          let bubbleColor = 'bg-white text-black';
          let corners = 'rounded-r-2xl rounded-bl-2xl';

          if (isUser) {
            alignment = 'justify-end';
            bubbleColor = 'bg-green-300 text-black';
            corners = 'rounded-l-2xl rounded-br-2xl';
          } else if (isInternal) {
            alignment = 'justify-center';
            bubbleColor = 'bg-gray-300 italic text-sm';
            corners = 'rounded-md';
          } else if (isSystem) {
            alignment = 'justify-center';
            bubbleColor = 'bg-blue-200 text-black text-xs';
            corners = 'rounded-md';
          }

          const parsed = parseMessageText(msg.content);
          const timeStamp = formatTimestamp(msg.timestamp);
          const msgKey = `msg-${idx}`;

          return (
            <div key={msgKey} className={`flex ${alignment} my-1`}>
              <div className={`${bubbleColor} ${corners} p-2 max-w-[70%] shadow-sm`}>
                <div className="text-xs text-gray-600 mb-1 flex justify-between">
                  {/* If isAssistant => label? Let's do it. */}
                  <span>{isUser ? 'User' : (isAssistant ? 'Assistant' : msg.role)}</span>
                  <span>{timeStamp}</span>
                </div>
                {renderParsedContent(parsed)}

                {/* If user bubble => show Delivered if set */}
                {isUser && deliveryStatus[msg.content] && (
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {deliveryStatus[msg.content]}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* partial typed AI final */}
        {loadingAI && simulatedMsg && (
          <div className="flex justify-start my-1">
            <div className="bg-white text-black rounded-r-2xl rounded-bl-2xl shadow-sm p-2 max-w-[70%]">
              {renderParsedContent(partialParsed)}
            </div>
          </div>
        )}
        {loadingAI && !simulatedMsg && <TypingBubble />}
      </div>

      {/* Media if any */}
      {conversation.media && conversation.media.length > 0 && (
        <div className="border-t border-gray-300 p-3">
          <h3 className="text-sm font-bold mb-2">Media Gallery</h3>
          <div className="flex flex-wrap gap-4">
            {conversation.media.map((m) => (
              <div key={m.id} className="w-32 h-32 border border-gray-300 overflow-hidden">
                <img
                  src={m.url}
                  alt={m.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Answers */}
      {suggestedAnswers.length > 0 && (
        <div className="border-t border-gray-300 p-3">
          <p className="text-sm font-bold mb-1">Possible Responses:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedAnswers.map((ans, i) => (
              <button
                key={i}
                onClick={() => handleSend(ans)}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
              >
                {ans}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar + emoji toggle */}
      <div className="p-3 border-t border-gray-300 flex items-center gap-2">
        {/* Toggle emoji picker */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-2xl"
        >
          😊
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-2 bg-white border rounded shadow p-2 grid grid-cols-5 gap-2 z-10">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => handleEmojiClick(e)}
                className="hover:bg-gray-100 rounded"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <input
          className="flex-1 px-3 py-2 rounded-md border text-sm"
          placeholder="iMessage..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loadingAI) handleSend();
          }}
          disabled={loadingAI}
        />

        {loadingAI ? (
          <button
            onClick={handleStop}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => handleSend()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
