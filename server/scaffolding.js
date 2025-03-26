// server/scaffolding.js
const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

const BASE_PROJECTS_DIR = path.join(__dirname, 'projects');

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * generateScaffold: ask the synergy to produce a JSON describing file structure
 * and write them to disk
 */
async function generateScaffold(convo, projectId, openaiApiKey) {
  const openai = new OpenAIApi(new Configuration({ apiKey: openaiApiKey }));
  // We'll do a short system instruction to produce the file structure
  const messagesForAI = convo.messages.map(m => ({
    role: (m.role === 'assistant-internal') ? 'assistant' : m.role,
    content: m.content
  }));
  messagesForAI.unshift({
    role: 'system',
    content: `Output ONLY valid JSON in the format:
{
  "files": [
    { "path": "folder/file.ext", "content": "..." },
    ...
  ]
}
No extra commentary. 
Keep it short. 
No code fences. 
We want actual file paths and contents.`
  });

  const resp = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messagesForAI,
    temperature: 0.7
  });

  const scaffoldText = resp.data.choices[0].message.content.trim();
  let data;
  try {
    data = JSON.parse(scaffoldText);
  } catch (err) {
    throw new Error(`Invalid JSON from synergy:\n${scaffoldText}`);
  }
  if (!data.files || !Array.isArray(data.files)) {
    throw new Error(`No "files" array. Raw:\n${scaffoldText}`);
  }

  const projectDir = path.join(BASE_PROJECTS_DIR, projectId);
  ensureDirExists(projectDir);

  data.files.forEach(f => {
    const filePath = path.join(projectDir, f.path);
    ensureDirExists(path.dirname(filePath));
    fs.writeFileSync(filePath, f.content, 'utf8');
  });

  return data.files;
}

module.exports = { generateScaffold };
