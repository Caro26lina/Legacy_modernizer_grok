


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const modernizeRouter = require('./routes/modernize');
const docsRouter     = require('./routes/docs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/modernize', modernizeRouter);
app.use('/api/docs',      docsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', model: 'grok-3-fast' }));

// Catch-all — serve index.html for any unknown route
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () =>
  console.log(`Legacy Modernization Engine (Grok) running on port ${PORT}`)
);
