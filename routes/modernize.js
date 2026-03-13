

const express  = require('express');
const router   = express.Router();
const { chat } = require('../utils/grokClient');
const { optimizeCode, calcContextStats } = require('../utils/contextOptimizer');

const TARGET_NAMES = {
  python:     'Python 3.12',
  go:         'Go 1.22',
  typescript: 'TypeScript 5',
  kotlin:     'Kotlin 2',
};

// ── POST /api/modernize ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { code, srcLang, targetLang, focusFn, optLevel } = req.body;

  if (!code || !srcLang || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields: code, srcLang, targetLang' });
  }

  try {
    const optimizedCode = optimizeCode(code, srcLang, optLevel || 'moderate', focusFn);
    const stats         = calcContextStats(code, optimizedCode);
    const targetName    = TARGET_NAMES[targetLang] || targetLang;

    const system = `You are an expert code modernization assistant specializing in converting legacy ${srcLang.toUpperCase()} to ${targetName}.
Rules:
- Output ONLY the modernized code — no prose, no markdown fences, no explanation.
- Use modern language idioms: type hints / dataclasses (Python), interfaces / error returns (Go), strict types (TypeScript), data classes (Kotlin).
- Preserve business logic exactly.
- Add brief inline comments only where logic is non-obvious.`;

    const user = `Convert the following context-optimized ${srcLang.toUpperCase()} code to ${targetName}.${
      focusFn ? ` Focus on the "${focusFn}" function and its dependencies.` : ''
    }

OPTIMIZED SOURCE (dead code and misleading comments already removed):

${optimizedCode}`;

    const modernizedCode = await chat(system, user, 1024);

    res.json({ success: true, modernizedCode, optimizedCode, stats });

  } catch (err) {
    console.error('Modernize error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── POST /api/modernize/multi-file ───────────────────────────────────────────
router.post('/multi-file', async (req, res) => {
  const { files, targetFn, targetLang } = req.body;

  if (!files?.length || !targetFn) {
    return res.status(400).json({ error: 'Missing required fields: files, targetFn' });
  }

  try {
    const targetName = TARGET_NAMES[targetLang] || 'Python 3.12';

    // Combine all files then optimise aggressively
    const combined     = files.map((f) => `// FILE: ${f.name}\n${f.content}`).join('\n\n');
    const optimizedCode = optimizeCode(combined, 'cobol', 'aggressive', targetFn);
    const stats         = calcContextStats(combined, optimizedCode);

    const modernizedCode = await chat(
      `You are a senior engineer modernizing legacy COBOL to ${targetName}. Output only code, no markdown fences.`,
      `Modernize the "${targetFn}" function and its call chain to ${targetName}.\n\n${optimizedCode}`,
      1024
    );

    res.json({ success: true, modernizedCode, stats });

  } catch (err) {
    console.error('Multi-file error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
