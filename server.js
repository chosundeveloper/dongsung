import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Simple in-memory user storage (for demo purposes)
const users = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register endpoint
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ message: '사용자명과 비밀번호를 입력해주세요.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: '사용자명은 최소 3자 이상이어야 합니다.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '비밀번호는 최소 6자 이상이어야 합니다.' });
  }

  // Check if user already exists
  if (users.has(username)) {
    return res.status(409).json({ message: '이미 존재하는 사용자명입니다.' });
  }

  // Store user (in production, use bcrypt and database)
  users.set(username, { password, createdAt: new Date() });

  res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ message: '사용자명과 비밀번호를 입력해주세요.' });
  }

  // Check if user exists
  const user = users.get(username);
  if (!user) {
    return res.status(401).json({ message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
  }

  // Check password (in production, use bcrypt.compare)
  if (user.password !== password) {
    return res.status(401).json({ message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
  }

  // Generate JWT token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

  res.json({ token, message: '로그인이 성공적으로 완료되었습니다.' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch-all 404 for API routes (to avoid serving SPA index.html for API calls)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API 엔드포인트를 찾을 수 없습니다.' });
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Serving static files from dist directory`);
});
