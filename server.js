// This file runs the backend server from backend/index.js
import('./backend/index.js').catch(err => {
  console.error('Failed to start backend server:', err);
  process.exit(1);
});
