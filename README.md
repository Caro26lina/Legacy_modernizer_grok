# Legacy Code Modernization Engine — Grok Edition


AI-powered developer tool that ingests legacy COBOL / Java repositories and suggests modern Python / Go equivalents, using **Context Optimization** to minimize LLM hallucinations.

**Powered by xAI Grok** (OpenAI-compatible API at `https://api.x.ai/v1`).

---

## Project structure

```
legacy-modernizer/
├── server.js                   ← Express entry point
├── package.json
├── .env.example                ← Copy to .env, fill in your key
├── routes/
│   ├── modernize.js            ← POST /api/modernize  &  /api/modernize/multi-file
│   └── docs.js                 ← POST /api/docs
├── utils/
│   ├── grokClient.js           ← Shared xAI / Grok client (openai SDK)
│   └── contextOptimizer.js     ← Dead-code stripping logic
└── public/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── samples.js          ← Sample COBOL / Java snippets
        └── app.js              ← All frontend logic
```

---

## Local development

```bash
# 1. Install
npm install

# 2. Set env vars
cp .env.example .env
# Edit .env — add your XAI_API_KEY from https://console.x.ai

# 3. Run
npm run dev      # nodemon (auto-reload)
# or
npm start
```

Open `http://localhost:3000`.

---

## Deploy to Render

### 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/legacy-modernizer.git
git push -u origin main
```

### 2 — Create a Web Service

1. Go to [render.com](https://render.com) → **New ▸ Web Service**
2. Connect your GitHub repository
3. Fill in:

| Field | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | Free |

### 3 — Add environment variables

In the Render dashboard → **Environment** tab, add:

| Key | Value |
|---|---|
| `XAI_API_KEY` | `xai-xxxxxxxxxxxxxxxxxxxx` |
| `GROK_MODEL` | `grok-3-fast` *(or `grok-3` for max capability)* |

### 4 — Deploy

Click **Deploy**. Your app will be live at `https://your-app.onrender.com`.

---

## API reference

### `POST /api/modernize`

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string | ✓ | Legacy source code |
| `srcLang` | string | ✓ | `cobol` · `java` · `fortran` · `pl1` |
| `targetLang` | string | ✓ | `python` · `go` · `typescript` · `kotlin` |
| `focusFn` | string | — | Target function name |
| `optLevel` | string | — | `aggressive` · `moderate` · `minimal` |

**Response**
```json
{
  "success": true,
  "modernizedCode": "def calc_compound(principal, rate, years): ...",
  "optimizedCode":  "... (cleaned source) ...",
  "stats": {
    "reduction": 42,
    "linesRemoved": 12,
    "optimizedPct": 18
  }
}
```

### `POST /api/modernize/multi-file`

```json
{
  "files": [{ "name": "PAYROLL.cbl", "content": "..." }],
  "targetFn": "CALCULATE-NET-PAY",
  "targetLang": "python"
}
```

### `POST /api/docs`

```json
{
  "code": "...",
  "docType": "API reference"
}
```

`docType` options: `API reference` · `Migration guide (legacy → modern)` · `Business logic explanation` · `Data flow diagram description`

---

## Context optimization levels

| Level | What gets stripped |
|---|---|
| `aggressive` | All comments + all dead patterns |
| `moderate` | Misleading comments + dead patterns (keeps genuine doc comments) |
| `minimal` | Dead branches and obviously obsolete data items only |
# Legacy_modernizer_grok
