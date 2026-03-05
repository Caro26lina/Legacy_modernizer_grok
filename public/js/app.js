

/* ── Tab switching ─────────────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* ── Sample loaders ────────────────────────────────────────────────────────── */
document.getElementById('load-sample-btn').addEventListener('click', () => {
  const lang = document.getElementById('src-lang').value;
  document.getElementById('legacy-code').value =
    lang === 'java' ? SAMPLES.java : SAMPLES.cobol;
  document.getElementById('focus-fn').value =
    lang === 'java' ? 'processPayment' : 'CALC-COMPOUND';
});

document.getElementById('load-doc-sample-btn').addEventListener('click', () => {
  document.getElementById('doc-code').value = SAMPLES.doc;
});

/* ── Clear ─────────────────────────────────────────────────────────────────── */
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('legacy-code').value = '';
  document.getElementById('focus-fn').value = '';
  document.getElementById('output-card').style.display = 'none';
  document.getElementById('steps-vis').style.display = 'none';
  document.getElementById('ctx-vis').style.display = 'none';
});

/* ── Copy buttons ──────────────────────────────────────────────────────────── */
function setupCopy(btnId, srcId, defaultLabel) {
  document.getElementById(btnId).addEventListener('click', function () {
    const text = document.getElementById(srcId).innerText;
    navigator.clipboard.writeText(text).catch(() => {});
    this.textContent = 'Copied!';
    setTimeout(() => (this.textContent = defaultLabel), 1600);
  });
}
setupCopy('copy-output-btn', 'output-area', 'Copy code');
setupCopy('copy-docs-btn',   'doc-area',    'Copy');

/* ── Step helpers ──────────────────────────────────────────────────────────── */
function setStep(n, state) {
  const dot = document.getElementById('s' + n);
  const txt = document.getElementById('s' + n + 't');
  dot.className = 'step-dot ' + state;
  dot.textContent = state === 'done' ? '✓' : String(n);
  txt.className = 'step-text' + (state === 'active' ? ' active' : '');
}
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ══════════════════════════════ MODERNIZE ═══════════════════════════════════ */
document.getElementById('analyze-btn').addEventListener('click', async () => {
  const code = document.getElementById('legacy-code').value.trim();
  if (!code) return alert('Please paste some legacy code first.');

  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Processing…';

  // Show pipeline steps
  const stepsEl = document.getElementById('steps-vis');
  stepsEl.style.display = 'block';
  [1, 2, 3, 4, 5].forEach((i) => setStep(i, 'idle'));

  // Show context bars
  const ctxEl = document.getElementById('ctx-vis');
  ctxEl.style.display = 'block';
  const origPct = Math.min(99, Math.round((code.length / 4 / 8192) * 100));
  document.getElementById('orig-pct').textContent = origPct + '%';
  document.getElementById('orig-bar').style.width  = origPct + '%';

  // Animate steps 1–3 before the network request
  await delay(350); setStep(1, 'active');
  await delay(500); setStep(1, 'done'); setStep(2, 'active');
  await delay(420); setStep(2, 'done'); setStep(3, 'active');
  await delay(420); setStep(3, 'done'); setStep(4, 'active');

  // Show output card with loading state
  const outputCard = document.getElementById('output-card');
  const outputArea = document.getElementById('output-area');
  outputCard.style.display = 'block';
  outputArea.innerHTML = '<span class="placeholder"><span class="spinner"></span>Waiting for Grok…</span>';

  try {
    const res = await fetch('/api/modernize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        srcLang:    document.getElementById('src-lang').value,
        targetLang: document.getElementById('target-lang').value,
        focusFn:    document.getElementById('focus-fn').value.trim(),
        optLevel:   document.getElementById('opt-level').value,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Server error');

    setStep(4, 'done'); setStep(5, 'active');
    await delay(300);   setStep(5, 'done');

    // Update optimized bar with real stats
    const s = data.stats;
    document.getElementById('opt-pct').textContent = s.optimizedPct + '%';
    document.getElementById('opt-bar').style.width  = s.optimizedPct + '%';

    // Stats
    document.getElementById('stats-row').innerHTML = `
      <div class="stat"><div class="stat-val">${s.reduction}%</div><div class="stat-lbl">Context reduced</div></div>
      <div class="stat"><div class="stat-val">${s.linesRemoved}</div><div class="stat-lbl">Lines pruned</div></div>
      <div class="stat"><div class="stat-val">${s.optimizedPct}%</div><div class="stat-lbl">Window used</div></div>`;

    outputArea.textContent = data.modernizedCode;

  } catch (err) {
    setStep(4, 'idle'); setStep(5, 'idle');
    outputArea.textContent = 'Error: ' + err.message;
  }

  btn.disabled  = false;
  btn.textContent = 'Modernize code';
});

/* ══════════════════════════ MULTI-FILE ══════════════════════════════════════ */
const EXTRA_FILES = ['PAYROLL-MASTER.cbl', 'INTEREST-CALC.cbl', 'BATCH-PROC.cbl', 'GL-POSTING.cbl'];
let fileCount = 5;

document.getElementById('add-file-btn').addEventListener('click', () => {
  const fl   = document.getElementById('file-list');
  const name = EXTRA_FILES[fileCount % EXTRA_FILES.length];
  const row  = Object.assign(document.createElement('div'), { className: 'file-row' });
  row.innerHTML = `<span class="file-name mono">${name}</span><span class="file-badge fb-cobol">COBOL</span>`;
  fl.appendChild(row);
  fileCount++;
});

document.getElementById('build-graph-btn').addEventListener('click', () => {
  document.getElementById('dep-card').style.display = 'block';

  const included = ['CALCULATE-NET-PAY', 'CALC-GROSS-PAY', 'APPLY-TAX', 'CALC-DEDUCTIONS', 'GET-TAX-BRACKET', 'ROUND-CURRENCY'];
  const pruned   = ['OLD-REPORT-GEN', 'PRINT-LEGACY-STUB', 'Y2K-FIXUP', 'DEBUG-DUMP', 'UNUSED-COPY-MEMBER'];

  document.getElementById('dep-included').innerHTML = included.map((n) => `<span class="dep-chip active">${n}</span>`).join('');
  document.getElementById('dep-pruned').innerHTML   = pruned.map((n)   => `<span class="dep-chip pruned">${n}</span>`).join('');
});

document.getElementById('modernize-multi-btn').addEventListener('click', async () => {
  const btn  = document.getElementById('modernize-multi-btn');
  const out  = document.getElementById('multi-output');
  const area = document.getElementById('multi-out-area');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Modernizing…';
  out.style.display = 'block';
  area.innerHTML = '<span class="placeholder"><span class="spinner"></span>Sending optimized dependency slice to Grok…</span>';

  try {
    const res = await fetch('/api/modernize/multi-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetFn:   'CALCULATE-NET-PAY',
        targetLang: 'python',
        files: [{
          name: 'PAYROLL-CALC.cbl',
          content: `CALCULATE-NET-PAY calls CALC-GROSS-PAY, APPLY-TAX, CALC-DEDUCTIONS.
CALC-GROSS-PAY: multiply hours worked by hourly rate.
APPLY-TAX: look up bracket from GET-TAX-BRACKET, subtract tax from gross.
CALC-DEDUCTIONS: subtract provident fund (12% of basic), health insurance flat 500.
GET-TAX-BRACKET: if income > 1000000 return 0.30, elif > 500000 return 0.20, else return 0.10.
ROUND-CURRENCY: round to 2 decimal places.`,
        }],
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Server error');
    area.textContent = data.modernizedCode;

  } catch (err) {
    area.textContent = 'Error: ' + err.message;
  }

  btn.disabled    = false;
  btn.textContent = 'Modernize with optimized context';
});

/* ══════════════════════════════ DOCS ════════════════════════════════════════ */
document.getElementById('doc-btn').addEventListener('click', async () => {
  const code = document.getElementById('doc-code').value.trim();
  if (!code) return alert('Please paste code to document.');

  const btn  = document.getElementById('doc-btn');
  const card = document.getElementById('doc-output');
  const area = document.getElementById('doc-area');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Generating…';
  card.style.display = 'block';
  area.innerHTML = '<span class="placeholder"><span class="spinner"></span>Generating documentation…</span>';

  try {
    const res = await fetch('/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        docType: document.getElementById('doc-type').value,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Server error');
    area.textContent = data.documentation;

  } catch (err) {
    area.textContent = 'Error: ' + err.message;
  }

  btn.disabled    = false;
  btn.textContent = 'Generate docs';
});
