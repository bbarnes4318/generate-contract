import express from 'express';
import cors from 'cors';
import handler from './send-email.js';

const app = express();
app.use(cors());
app.use(express.json());

// Wrap the Vercel-style handler for Express
app.post('/api/send-email', (req, res) => handler(req, res));
app.options('/api/send-email', (req, res) => handler(req, res));

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`Email API running on port ${PORT}`));
