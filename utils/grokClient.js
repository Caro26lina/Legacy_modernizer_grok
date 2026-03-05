

// Grok API is OpenAI-compatible — we just point the OpenAI SDK at api.x.ai
const OpenAI = require('openai');

const grok = new OpenAI({
  apiKey:  process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// Default model — swap to 'grok-3' for maximum capability
const MODEL = process.env.GROK_MODEL || 'grok-3-fast';

/**
 * Simple chat wrapper.
 * @param {string} system
 * @param {string} user
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
async function chat(system, user, maxTokens = 1024) {
  const response = await grok.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
  });
  return response.choices[0].message.content ?? '';
}

module.exports = { grok, chat, MODEL };
