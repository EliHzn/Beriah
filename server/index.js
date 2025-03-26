// server/index.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const {
  createConversation,
  getConversation,
  allConversations,
  deleteConversation,      // imported to handle DELETE
  updateSettings,
  addUserMessage,
  addInternalMessage,
  addAssistantMessage
} = require('./conversations');
const { generateScaffold } = require('./scaffolding');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ChatGPT = secondary
const CHATGPT_MODEL = 'gpt-3.5-turbo';
const CHATGPT_NAME = 'ChatGPT (gpt-3.5-turbo)';

// Grok = primary
const GROK_MODEL = 'grok-2-latest';
const GROK_NAME = 'Grok (primary)';

/**
 * transformMessagesForAI: 
 * Convert 'assistant-internal' => 'assistant' 
 * for synergy calls to ChatGPT/Grok
 */
function transformMessagesForAI(msgs) {
  return msgs.map(m => ({
    role: (m.role === 'assistant-internal') ? 'assistant' : m.role,
    content: m.content
  }));
}

async function runChatGPTPass(systemContent, convo) {
  const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  }));
  const messages = transformMessagesForAI(convo.messages);
  const resp = await openai.createChatCompletion({
    model: CHATGPT_MODEL,
    messages: [
      { role: 'system', content: systemContent },
      ...messages
    ],
    temperature: 0.7
  });
  return resp.data?.choices[0]?.message?.content || '';
}

async function runGrokPass(systemContent, convo) {
  const messages = transformMessagesForAI(convo.messages);
  const resp = await axios.post(
    'https://api.x.ai/v1/chat/completions',
    {
      model: GROK_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      temperature: 0.7
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROK_API_KEY}`
      }
    }
  );
  return resp.data?.choices?.[0]?.message?.content || '';
}

/** indefinite synergy with Grok as primary final */
async function indefiniteSynergy(projectId, userMsg, progressCB, abortSignal) {
  addUserMessage(projectId, userMsg);

  let loopCount = 0;
  while (true) {
    loopCount++;
    progressCB(`Pass #${loopCount} - Grok -> ChatGPT -> check final`);

    if (abortSignal.aborted) throw new Error('Aborted');

    // Step A: Grok
    const convo = getConversation(projectId);
    const grokNote = await runGrokPass(`
You are ${GROK_NAME}, synergy pass. 
Keep it short, minimal fluff. 
If you're ready to finalize user-facing, add "###FINAL###" or "finalizing now."
Otherwise produce a short note for ChatGPT.`, convo);

    addInternalMessage(projectId, GROK_NAME, grokNote);

    if (grokNote.includes('###FINAL###') || grokNote.toLowerCase().includes('finalizing')) {
      // final user-facing from Grok
      const finalResp = await runGrokPass(`
You are ${GROK_NAME}, produce the final user-facing message. 
Keep it short. 
If there's a question, provide "SUGGESTED_ANSWERS:" with bullet items. 
Don't display "###FINAL###".`, getConversation(projectId));
      addAssistantMessage(projectId, GROK_NAME, finalResp);
      return finalResp;
    }

    if (loopCount > 25) {
      // safety
      addAssistantMessage(projectId, GROK_NAME, '(Max synergy loops, forcibly finalizing.)');
      return '(max synergy loops reached)';
    }

    // Step B: ChatGPT
    if (abortSignal.aborted) throw new Error('Aborted');
    const conv2 = getConversation(projectId);
    const cgNote = await runChatGPTPass(`
You are ${CHATGPT_NAME}, synergy pass. 
Short note responding to Grok's last message: "${grokNote}". 
If you want to finalize, add "###FINAL###."`, conv2);

    addInternalMessage(projectId, CHATGPT_NAME, cgNote);

    if (cgNote.includes('###FINAL###') || cgNote.toLowerCase().includes('finalizing')) {
      // Grok is the primary; let Grok finalize
      const conv3 = getConversation(projectId);
      const grokFinal = await runGrokPass(`
ChatGPT signaled final, but you are the primary. 
Produce the final user-facing message. 
Keep it short, bullet-based if you want.`, conv3);

      addAssistantMessage(projectId, GROK_NAME, grokFinal);
      return grokFinal;
    }
  }
}

//------------------- ROUTES -------------------//

// health check
app.get('/', (req, res) => {
  res.send('Server with indefinite synergy (Grok primary), scaffolding, etc.');
});

/** GET /api/conversations => an array of all convos { projectId, name } */
app.get('/api/conversations', (req, res) => {
  const list = allConversations();
  res.json(list);
});

/** DELETE /api/conversations/:projectId => remove a conversation from store */
app.delete('/api/conversations/:projectId', (req, res) => {
  const success = deleteConversation(req.params.projectId);
  if (!success) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ message: 'Project deleted' });
});

/** POST /api/conversations => create a new synergy conversation */
app.post('/api/conversations', async (req, res) => {
  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: 'No idea provided' });

  const { projectId } = createConversation(idea);

  // greet from Grok quickly
  try {
    const conv = getConversation(projectId);
    const greet = await runGrokPass(`
You are ${GROK_NAME}, greet the user about idea: "${idea}" in 2 lines. 
Mention ChatGPT is also here, but you are final.`, conv);
    addAssistantMessage(projectId, GROK_NAME, greet);
  } catch (err) {
    console.error('Greeting error:', err);
    addAssistantMessage(projectId, GROK_NAME, '(Greet error)');
  }

  const updated = getConversation(projectId);
  res.json({
    projectId,
    name: updated.name,
    settings: updated.settings,
    messages: updated.messages,
    media: updated.media
  });
});

/** GET /api/conversations/:projectId => fetch details of one conversation */
app.get('/api/conversations/:projectId', (req, res) => {
  const c = getConversation(req.params.projectId);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({
    projectId: req.params.projectId,
    name: c.name,
    settings: c.settings,
    messages: c.messages,
    media: c.media
  });
});

/** POST /api/conversations/:projectId/message => indefinite synergy loop */
app.post('/api/conversations/:projectId/message', async (req, res) => {
  const convo = getConversation(req.params.projectId);
  if (!convo) return res.status(404).json({ error: 'Not found' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  let synergySteps = [];
  let finalText = null;
  const abortSignal = { aborted: false };

  function progressCB(msg) {
    synergySteps.push(msg);
  }

  try {
    finalText = await indefiniteSynergy(
      req.params.projectId,
      message,
      progressCB,
      abortSignal
    );
  } catch (err) {
    if (err.message === 'Aborted') {
      return res.json({
        aborted: true,
        projectId: req.params.projectId,
        stepsLog: synergySteps,
        messages: getConversation(req.params.projectId)?.messages
      });
    } else {
      console.error('Synergy error:', err);
    }
  }

  const updated = getConversation(req.params.projectId);
  res.json({
    projectId: req.params.projectId,
    name: updated.name,
    settings: updated.settings,
    messages: updated.messages,
    media: updated.media,
    stepsLog: synergySteps,
    finalText
  });
});

/** POST /api/conversations/:projectId/settings => update conversation settings */
app.post('/api/conversations/:projectId/settings', (req, res) => {
  const updated = updateSettings(req.params.projectId, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

/** POST /api/conversations/:projectId/scaffold => synergy code generation */
app.post('/api/conversations/:projectId/scaffold', async (req, res) => {
  const c = getConversation(req.params.projectId);
  if (!c) return res.status(404).json({ error: 'Not found' });
  try {
    const files = await generateScaffold(c, req.params.projectId, process.env.OPENAI_API_KEY);
    res.json({ message: 'Scaffold generated', files });
  } catch (err) {
    console.error('Scaffold error:', err);
    res.status(500).json({ error: err.message });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}, indefinite synergy with Grok as primary!`);
});
