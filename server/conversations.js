// server/conversations.js

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PERSIST_PATH = path.join(__dirname, 'persist.json');

/**
 * store = {
 *   conversations: {
 *     [projectId]: {
 *       name: string,
 *       settings: {},
 *       messages: [...],
 *       media: [...]
 *     }
 *   }
 * }
 */
let store = { conversations: {} };

// Attempt to load from disk
if (fs.existsSync(PERSIST_PATH)) {
  try {
    const raw = fs.readFileSync(PERSIST_PATH, 'utf8');
    store = JSON.parse(raw);
  } catch {
    console.warn('persist.json invalid, starting fresh');
    store = { conversations: {} };
  }
}

// Save to disk
function saveStore() {
  fs.writeFileSync(PERSIST_PATH, JSON.stringify(store, null, 2), 'utf8');
}

/** Create new conversation with synergy system prompt */
function createConversation(idea) {
  const projectId = uuidv4();
  const defaultName = `Project-${projectId.slice(0, 5)}`;

  // Enhanced system prompt that outlines phases and encourages continuing
  const systemContent = `
You are Grok (primary) and ChatGPT (secondary), collaborating on app creation in multiple phases:
Phase 1: Requirements & Vision
Phase 2: Tech Stack & Architecture
Phase 3: Implementation & Code
Phase 4: Testing & Deployment

If user is idle, keep moving forward through each phase automatically. 
When all phases are done or no more content, produce "###FINAL###".
Keep responses short. Whenever you ask a question, provide "SUGGESTED_ANSWERS:" with bullet items.

Idea: "${idea}"
`;

  store.conversations[projectId] = {
    name: defaultName,
    settings: {},
    messages: [
      {
        role: 'system',
        content: systemContent,
        timestamp: new Date().toISOString()
      }
    ],
    media: []
  };
  saveStore();
  return { projectId };
}

/** Return a conversation object if it exists */
function getConversation(projectId) {
  return store.conversations[projectId];
}

/** Save entire conversation object (e.g. after modifications) */
function saveConversation(projectId, data) {
  store.conversations[projectId] = data;
  saveStore();
}

/** 
 * List all conversations => array of { projectId, name } 
 * for GET /api/conversations 
 */
function allConversations() {
  return Object.entries(store.conversations).map(([projectId, convo]) => ({
    projectId,
    name: convo.name
  }));
}

/** Update settings of a conversation */
function updateSettings(projectId, newSettings) {
  const c = getConversation(projectId);
  if (!c) return null;
  c.settings = { ...c.settings, ...newSettings };
  saveConversation(projectId, c);
  return c.settings;
}

/** Add messages to conversation */
function addMessage(projectId, role, content, ai) {
  const c = getConversation(projectId);
  if (!c) return;
  c.messages.push({
    role,
    content,
    ai,
    timestamp: new Date().toISOString()
  });
  saveConversation(projectId, c);
}

function addUserMessage(projectId, content) {
  addMessage(projectId, 'user', content);
}
function addInternalMessage(projectId, aiName, content) {
  addMessage(projectId, 'assistant-internal', content, aiName);
}
function addAssistantMessage(projectId, aiName, content) {
  addMessage(projectId, 'assistant', content, aiName);
}

/** If synergy wants images, we store them here */
function addMedia(projectId, prompt, url) {
  const c = getConversation(projectId);
  if (!c) return null;
  const id = uuidv4();
  c.media.push({ id, prompt, url });
  saveStore();
  return { id, prompt, url };
}

/** DELETE a conversation by ID. Return true if found, else false */
function deleteConversation(projectId) {
  if (store.conversations[projectId]) {
    delete store.conversations[projectId];
    saveStore();
    return true;
  }
  return false;
}

module.exports = {
  createConversation,
  getConversation,
  allConversations,
  updateSettings,
  addUserMessage,
  addInternalMessage,
  addAssistantMessage,
  addMedia,
  deleteConversation,
  saveStore
};
