# Hello World -> Akash my love
const express  = require('express');
const router   = express.Router();
const { chat } = require('../utils/grokClient');

const DOC_PROMPTS = {
  'API reference':
    'Generate a concise API reference for this legacy code. Include: function name, purpose, parameters (inferred from data declarations), return value, and a usage example. Plain text only — no markdown.',

  'Migration guide (legacy → modern)':
    'Write a step-by-step migration guide explaining how to port this legacy COBOL code to Python. Focus on conceptual mappings: WORKING-STORAGE → dataclass, PERFORM → function call, COMPUTE → arithmetic expression. Plain text.',

  'Business logic explanation':
    'Explain the business logic in this code in plain English for a non-technical stakeholder. Cover: what it calculates, the business rules involved, who would use it, and any edge cases. No technical jargon.',

  'Data flow diagram description':
    'Describe the data flow as a structured text outline showing inputs → processing steps → outputs. Use indentation for hierarchy. Plain text only.',
};

// ── POST /api/docs ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { code, docType } = req.body;

  if (!code || !docType) {
    return res.status(400).json({ error: 'Missing required fields: code, docType' });
  }

  const prompt = DOC_PROMPTS[docType];
  if (!prompt) {
    return res.status(400).json({ error: `Unknown docType: "${docType}"` });
  }

  try {
    const documentation = await chat(
      'You are a technical documentation writer specialising in legacy systems. Output only the requested documentation — no preamble, no markdown.',
      `${prompt}\n\nCODE:\n${code}`,
      1024
    );

    res.json({ success: true, documentation });

  } catch (err) {
    console.error('Docs error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
