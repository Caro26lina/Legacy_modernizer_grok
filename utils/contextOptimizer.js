/**
 * Context Optimizer
 * ─────────────────
 * Strips dead code, misleading comments, and irrelevant branches
 * before sending legacy code to the LLM.
 *
 * Three levels:
 *   aggressive — strip ALL comments + all dead patterns
 *   moderate   — keep genuine doc comments, strip misleading ones  (default)
 *   minimal    — only strip dead branches and obviously obsolete data items
 */

// ── Patterns that mark dead / obsolete identifiers ──────────────────────────
const DEAD_ID_PATTERNS = {
  cobol: [
    /\bWS-OLD-/i,
    /\bWS-OBSOLETE\b/i,
    /\bWS-DEPRECATED\b/i,
    /\bOLD-TAX\b/i,
    /\bLEGACY-/i,
    /\bY2K-/i,
    /\bDEBUG-/i,
    /\bUNUSED-/i,
  ],
  java: [
    /\boldAuditLog\b/,
    /\blegacyId\b/,
    /\bLEGACY_/,
    /\bDEPRECATED_/,
  ],
};

// ── Comments that explicitly say the code is dead / wrong ───────────────────
const MISLEADING_COMMENT_RE = [
  /DEAD\s+(BRANCH|CODE|LOGIC)/i,
  /NEVER\s+(CALLED|REACHED|USED)/i,
  /NO\s+LONGER\s+USED/i,
  /OUTDATED/i,
  /OBSOLETE/i,
  /\bIGNORE\b/i,
  /\bDEPRECATED\b/i,
  /TEMP(ORARY)?[\s:]/i,
  /\bFIXME\b/i,
  /HACK:/i,
  /TODO:/i,
];

// ── COBOL: remove whole dead paragraphs ─────────────────────────────────────
function removeCobolDeadParagraphs(lines) {
  const deadParagraphs = new Set();

  lines.forEach((line) => {
    // A COBOL paragraph header starts in column 8+ and ends with a period
    const m = line.match(/^\s{6,}([A-Z0-9][A-Z0-9-]+)\.\s*$/);
    if (m && /OLD-|UNUSED-|LEGACY-|DEBUG-|Y2K-|OBSOLETE/i.test(m[1])) {
      deadParagraphs.add(m[1]);
    }
  });

  if (!deadParagraphs.size) return lines;

  let inDead = false;
  return lines.filter((line) => {
    const m = line.match(/^\s{6,}([A-Z0-9][A-Z0-9-]+)\.\s*$/);
    if (m) inDead = deadParagraphs.has(m[1]);
    return !inDead;
  });
}

// ── Java: remove @Deprecated methods ────────────────────────────────────────
function removeJavaDeprecatedMethods(lines) {
  const result = [];
  let skipMethod = false;
  let braceDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '@Deprecated') {
      skipMethod = true;
      continue;
    }

    if (skipMethod) {
      // Wait for the method signature
      if (/\b(public|private|protected|static)\b/.test(trimmed) && trimmed.endsWith('{')) {
        braceDepth = 1;
        continue;
      }
      if (braceDepth > 0) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;
        if (braceDepth <= 0) { skipMethod = false; braceDepth = 0; }
        continue;
      }
      // No opening brace yet found → keep going until we find method start
      if (/\b(public|private|protected)\b/.test(trimmed)) {
        braceDepth = 0; // method signature without immediate brace
        continue;
      }
    }

    result.push(line);
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function optimizeCode(code, lang, level = 'moderate', _focusFn = '') {
  let lines = code.split('\n');
  const deadPatterns = DEAD_ID_PATTERNS[lang] || [];

  if (lang === 'cobol') {
    lines = removeCobolDeadParagraphs(lines);

    lines = lines.filter((line) => {
      const trimmed = line.trim();

      // COBOL comments start with * in col 7
      if (trimmed.startsWith('*')) {
        if (level === 'aggressive') return false;
        if (MISLEADING_COMMENT_RE.some((re) => re.test(trimmed))) return false;
        return true;
      }

      // Dead data items
      if (deadPatterns.some((re) => re.test(trimmed))) return false;

      return true;
    });

  } else if (lang === 'java') {
    lines = removeJavaDeprecatedMethods(lines);

    lines = lines.filter((line) => {
      const trimmed = line.trim();

      // Inline // comments
      if (trimmed.startsWith('//')) {
        if (level === 'aggressive') return false;
        if (level !== 'minimal' && MISLEADING_COMMENT_RE.some((re) => re.test(trimmed))) return false;
        return true;
      }

      if (deadPatterns.some((re) => re.test(trimmed))) return false;

      return true;
    });

  } else {
    // Generic — strip misleading comment lines
    if (level !== 'minimal') {
      lines = lines.filter((line) => !MISLEADING_COMMENT_RE.some((re) => re.test(line)));
    }
  }

  // Collapse consecutive blank lines to one
  const cleaned = [];
  let lastBlank = false;
  for (const line of lines) {
    const blank = line.trim() === '';
    if (blank && lastBlank) continue;
    lastBlank = blank;
    cleaned.push(line);
  }

  return cleaned.join('\n').trim();
}

// ── Stats ────────────────────────────────────────────────────────────────────
function calcContextStats(original, optimized, windowSize = 8192) {
  const origTokens  = Math.ceil(original.length  / 4);
  const optTokens   = Math.ceil(optimized.length / 4);
  const origLines   = original.split('\n').length;
  const optLines    = optimized.split('\n').length;

  return {
    originalTokens:  origTokens,
    optimizedTokens: optTokens,
    originalLines:   origLines,
    optimizedLines:  optLines,
    linesRemoved:    Math.max(0, origLines - optLines),
    reduction:       Math.round((1 - optTokens / Math.max(origTokens, 1)) * 100),
    originalPct:     Math.min(99, Math.round((origTokens  / windowSize) * 100)),
    optimizedPct:    Math.min(99, Math.round((optTokens   / windowSize) * 100)),
  };
}

module.exports = { optimizeCode, calcContextStats };
