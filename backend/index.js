const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT tokens
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret_key'; // CHANGE THIS IN PRODUCTION!
const SALT_ROUNDS = 10;

// --- 미들웨어 설정 ---
app.use(cors());
app.use(express.json()); // for parsing application/json
// 루트 경로에서 공개 파일 제공 (네이버 검증 파일 등)
app.use(express.static(path.join(__dirname, '../public')));
// 업로드된 이미지를 제공하기 위한 정적 파일 서버
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tracker API 프록시 (CORS 우회)
app.use('/tracker-api', createProxyMiddleware({
  target: 'http://tracker25.duckdns.org',
  changeOrigin: true,
  pathRewrite: { '^/tracker-api': '/api' },
}));


// --- 데이터베이스 설정 ---
const db = new sqlite3.Database('./dongsung.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating users table', err.message);
      else console.log('Table "users" is ready.');
    });

    // Daily photos table (하루에 하나의 대표 사진)
    db.run(`CREATE TABLE IF NOT EXISTS daily_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE UNIQUE NOT NULL,
      imageUrl TEXT NOT NULL,
      uploadedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(uploadedBy) REFERENCES users(id)
    )`, (err) => {
      if (err) console.error('Error creating daily_photos table', err.message);
      else console.log('Table "daily_photos" is ready.');
    });

    // Comments table (묵상 댓글)
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dailyPhotoId INTEGER NOT NULL,
      content TEXT NOT NULL,
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(dailyPhotoId) REFERENCES daily_photos(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`, (err) => {
      if (err) console.error('Error creating comments table', err.message);
      else console.log('Table "comments" is ready.');
    });

    // Legacy posts table (기존 호환성 유지)
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      imageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      userId INTEGER,
      authorName TEXT,
      password TEXT,
      postDate TEXT,
      category TEXT DEFAULT 'share',
      FOREIGN KEY(userId) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating table', err.message);
      } else {
        console.log('Table "posts" is ready.');
        ensureColumn('posts', 'authorName', 'TEXT');
        ensureColumn('posts', 'password', 'TEXT');
        ensureColumn('posts', 'postDate', 'TEXT');
        ensureColumn('posts', 'category', "TEXT DEFAULT 'share'");
      }
    });

    // Daily words for 날짜별 말씀 저장
    db.run(`CREATE TABLE IF NOT EXISTS daily_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      passage TEXT,
      content TEXT NOT NULL,
      authorName TEXT NOT NULL,
      password TEXT NOT NULL,
      imageUrl TEXT,
      fileUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating daily_words table', err.message);
      } else {
        console.log('Table "daily_words" is ready.');
        ensureColumn('daily_words', 'imageUrl', 'TEXT');
        ensureColumn('daily_words', 'fileUrl', 'TEXT');
      }
    });

    // 말씀 사진 테이블 (다중 이미지 지원)
    db.run(`CREATE TABLE IF NOT EXISTS daily_word_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dailyWordId INTEGER NOT NULL,
      imageUrl TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(dailyWordId) REFERENCES daily_words(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) console.error('Error creating daily_word_images table', err.message);
      else console.log('Table "daily_word_images" is ready.');
    });

    // 말씀 나눔 게시판 (비회원 작성)
    db.run(`CREATE TABLE IF NOT EXISTS word_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      authorName TEXT NOT NULL,
      password TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating word_shares table', err.message);
      else console.log('Table "word_shares" is ready.');
    });

    // 사진 공유 갤러리 (회원 작성)
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      authorName TEXT NOT NULL,
      password TEXT,
      title TEXT,
      imageUrl TEXT NOT NULL,
      userId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`, (err) => {
      if (err) console.error('Error creating gallery table', err.message);
      else {
        console.log('Table "gallery" is ready.');
        ensureColumn('gallery', 'userId', 'INTEGER');
      }
    });
  }
});

function ensureColumn(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
    if (err) {
      console.error(`Failed to inspect table ${table}`, err.message);
      return;
    }
    const exists = rows.some((row) => row.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add column ${column} to ${table}`, alterErr.message);
        } else {
          console.log(`Column ${column} added to ${table}`);
        }
      });
    }
  });
}

// --- 파일 업로드(Multer) 설정 ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: (req, file, cb) => {
    // 파일명 중복을 피하기 위해 타임스탬프를 추가
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// --- 인증 미들웨어 ---
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};


// --- API Endpoints ---

// 사용자 등록
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (row) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Save user to DB
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 사용자 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (!user) {
        console.warn(`[AUTH_FAIL] Login attempt with non-existent user: ${username}`);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn(`[AUTH_FAIL] Wrong password for user: ${username}`);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const payload = {
        user: {
          id: user.id,
          username: user.username
        }
      };

      jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '1h' }, // Token expires in 1 hour
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 비밀번호 변경
app.put('/api/users/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function (err) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.json({ message: 'Password updated successfully' });
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 비밀번호 재설정 (사용자 이름으로 비밀번호 변경)
app.post('/api/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Username and new password are required' });
  }

  try {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], function (err) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.json({ message: 'Password reset successfully' });
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// 모든 게시물 가져오기 (GET /api/posts) - PROTECTED
app.get('/api/posts', authMiddleware, (req, res) => {
  // Only authenticated users can access
  const sql = "SELECT * FROM posts ORDER BY createdAt DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'success', data: rows });
  });
});

// 날짜별 게시물 가져오기 (GET /api/posts/date/:date) - NO AUTH
app.get('/api/posts/date/:date', (req, res) => {
  const date = req.params.date; // YYYY-MM-DD 형식
  const startDate = `${date} 00:00:00`;
  const endDate = `${date} 23:59:59`;
  const sql = `SELECT * FROM posts WHERE createdAt BETWEEN ? AND ? ORDER BY createdAt DESC`;
  db.all(sql, [startDate, endDate], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'success', data: rows });
  });
});

// 월별/일별 게시물 개수 가져오기 (GET /api/posts/counts) - NO AUTH
app.get('/api/posts/counts', (req, res) => {
  const sql = `
    SELECT
      strftime('%Y-%m-%d', createdAt) as postDate,
      COUNT(*) as count
    FROM posts
    GROUP BY postDate
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const counts = rows.reduce((acc, row) => {
      acc[row.postDate] = row.count;
      return acc;
    }, {});
    res.json({ message: 'success', data: counts });
  });
});


// 새 게시물 작성 (POST /api/posts) - PROTECTED, supports multiple images
app.post('/api/posts', authMiddleware, upload.array('images', 10), (req, res) => {
  const { title, content, createdAt } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  if (!title || !content) {
    return res.status(400).json({ message: '제목과 내용을 입력해 주세요.' });
  }

  // Handle multiple images - store first image in imageUrl for compatibility
  const imageUrl = req.files && req.files.length > 0 ? `/uploads/${req.files[0].filename}` : null;

  // Use provided createdAt or default to current timestamp
  const timestamp = createdAt ? createdAt : new Date().toISOString();

  const sql = `INSERT INTO posts (title, content, imageUrl, authorName, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [title, content, imageUrl, username, userId, timestamp], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // For now, we're only storing the first image.
    // To support multiple images properly, you'd need a separate images table
    const allImageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    res.status(201).json({
      message: 'Post created successfully',
      data: {
        id: this.lastID,
        title,
        content,
        imageUrl,
        authorName: username,
        userId,
        createdAt: timestamp,
        allImages: allImageUrls // Return all uploaded images
      }
    });
  });
});


// === Daily Words API (공개 작성, 암호 기반 수정/삭제) ===
const sanitizeDailyWord = (row) => {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
};

const dailyWordUpload = upload.fields([
  { name: 'image', maxCount: 10 },
  { name: 'file', maxCount: 1 }
]);

const getUploadedPath = (files, fieldName) => {
  if (!files || !files[fieldName] || files[fieldName].length === 0) {
    return null;
  }
  return `/uploads/${files[fieldName][0].filename}`;
};

app.get('/api/daily-words/:date', (req, res) => {
  const date = req.params.date;
  db.get(`SELECT id, date, title, passage, content, authorName, imageUrl, fileUrl, createdAt, updatedAt FROM daily_words WHERE date = ?`, [date], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!row) {
      return res.json({ message: 'success', data: null });
    }
    // Fetch all images for this daily word
    db.all(`SELECT id, imageUrl, sortOrder FROM daily_word_images WHERE dailyWordId = ? ORDER BY sortOrder ASC`, [row.id], (imgErr, images) => {
      if (imgErr) {
        return res.status(500).json({ message: imgErr.message });
      }
      const sanitized = sanitizeDailyWord(row);
      sanitized.images = images || [];
      res.json({ message: 'success', data: sanitized });
    });
  });
});

// Helper to get all uploaded image paths
const getUploadedPaths = (files, fieldName) => {
  if (!files || !files[fieldName] || files[fieldName].length === 0) {
    return [];
  }
  return files[fieldName].map(f => `/uploads/${f.filename}`);
};

// Helper to fetch daily word with images
const fetchDailyWordWithImages = (dailyWordId, callback) => {
  db.get(`SELECT id, date, title, passage, content, authorName, imageUrl, fileUrl, createdAt, updatedAt FROM daily_words WHERE id = ?`, [dailyWordId], (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(null, null);
    db.all(`SELECT id, imageUrl, sortOrder FROM daily_word_images WHERE dailyWordId = ? ORDER BY sortOrder ASC`, [dailyWordId], (imgErr, images) => {
      if (imgErr) return callback(imgErr);
      const result = sanitizeDailyWord(row);
      result.images = images || [];
      callback(null, result);
    });
  });
};

// Helper to insert images into daily_word_images
const insertImages = (dailyWordId, imagePaths, startOrder, callback) => {
  if (imagePaths.length === 0) return callback(null);
  const stmt = db.prepare(`INSERT INTO daily_word_images (dailyWordId, imageUrl, sortOrder) VALUES (?, ?, ?)`);
  let completed = 0;
  imagePaths.forEach((url, idx) => {
    stmt.run([dailyWordId, url, startOrder + idx], (err) => {
      completed++;
      if (completed === imagePaths.length) {
        stmt.finalize();
        callback(err);
      }
    });
  });
};

app.post('/api/daily-words', dailyWordUpload, (req, res) => {
  const { date, title, passage = '', content, authorName, password, deleteImages } = req.body;
  const uploadedImagePaths = getUploadedPaths(req.files, 'image');
  const uploadedFileUrl = getUploadedPath(req.files, 'file');

  // Parse deleteImages - comma-separated image IDs to remove
  const imagesToDelete = deleteImages ? deleteImages.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];

  if (!date || !title || !content || !authorName || !password) {
    return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
  }

  db.get('SELECT * FROM daily_words WHERE date = ?', [date], (err, existing) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    const applyUpdate = () => {
      const fileUrl = uploadedFileUrl || existing.fileUrl || null;
      // Keep existing imageUrl for backward compatibility, use first new image if any
      const imageUrl = uploadedImagePaths.length > 0 ? uploadedImagePaths[0] : existing.imageUrl;

      const sql = `UPDATE daily_words SET title = ?, passage = ?, content = ?, authorName = ?, imageUrl = ?, fileUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE date = ?`;
      db.run(sql, [title, passage, content, authorName, imageUrl, fileUrl, date], function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ message: updateErr.message });
        }

        // Delete selected images if any
        const deleteAndAddImages = () => {
          if (imagesToDelete.length > 0) {
            const placeholders = imagesToDelete.map(() => '?').join(',');
            db.run(`DELETE FROM daily_word_images WHERE id IN (${placeholders}) AND dailyWordId = ?`, [...imagesToDelete, existing.id], (delErr) => {
              if (delErr) console.error('Error deleting images:', delErr);
              addNewImages();
            });
          } else {
            addNewImages();
          }
        };

        const addNewImages = () => {
          if (uploadedImagePaths.length > 0) {
            // Get current max sortOrder
            db.get(`SELECT MAX(sortOrder) as maxOrder FROM daily_word_images WHERE dailyWordId = ?`, [existing.id], (orderErr, orderRow) => {
              const startOrder = (orderRow?.maxOrder || 0) + 1;
              insertImages(existing.id, uploadedImagePaths, startOrder, (insertErr) => {
                if (insertErr) console.error('Error inserting images:', insertErr);
                fetchDailyWordWithImages(existing.id, (fetchErr, result) => {
                  if (fetchErr) return res.status(500).json({ message: fetchErr.message });
                  res.json({ message: '말씀이 업데이트되었습니다.', data: result });
                });
              });
            });
          } else {
            fetchDailyWordWithImages(existing.id, (fetchErr, result) => {
              if (fetchErr) return res.status(500).json({ message: fetchErr.message });
              res.json({ message: '말씀이 업데이트되었습니다.', data: result });
            });
          }
        };

        deleteAndAddImages();
      });
    };

    if (existing) {
      bcrypt.compare(password, existing.password, (compareErr, isMatch) => {
        if (compareErr) {
          return res.status(500).json({ message: compareErr.message });
        }
        if (!isMatch) {
          return res.status(403).json({ message: '비밀번호가 일치하지 않습니다.' });
        }
        applyUpdate();
      });
    } else {
      bcrypt.hash(password, SALT_ROUNDS, (hashErr, hash) => {
        if (hashErr) {
          return res.status(500).json({ message: hashErr.message });
        }
        const firstImageUrl = uploadedImagePaths.length > 0 ? uploadedImagePaths[0] : null;
        const sql = `INSERT INTO daily_words (date, title, passage, content, authorName, password, imageUrl, fileUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [date, title, passage, content, authorName, hash, firstImageUrl, uploadedFileUrl], function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ message: insertErr.message });
          }
          const newId = this.lastID;
          // Insert all images into the images table
          if (uploadedImagePaths.length > 0) {
            insertImages(newId, uploadedImagePaths, 0, (imgInsertErr) => {
              if (imgInsertErr) console.error('Error inserting images:', imgInsertErr);
              fetchDailyWordWithImages(newId, (fetchErr, result) => {
                if (fetchErr) return res.status(500).json({ message: fetchErr.message });
                res.status(201).json({ message: '말씀이 등록되었습니다.', data: result });
              });
            });
          } else {
            fetchDailyWordWithImages(newId, (fetchErr, result) => {
              if (fetchErr) return res.status(500).json({ message: fetchErr.message });
              res.status(201).json({ message: '말씀이 등록되었습니다.', data: result });
            });
          }
        });
      });
    }
  });
});

app.delete('/api/daily-words/:date', (req, res) => {
  const date = req.params.date;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: '비밀번호를 입력해 주세요.' });
  }

  db.get('SELECT * FROM daily_words WHERE date = ?', [date], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '등록된 말씀이 없습니다.' });
    }

    bcrypt.compare(password, row.password, (compareErr, isMatch) => {
      if (compareErr) {
        return res.status(500).json({ message: compareErr.message });
      }
      if (!isMatch) {
        return res.status(403).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      db.run('DELETE FROM daily_words WHERE date = ?', [date], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ message: deleteErr.message });
        }
        res.json({ message: '해당 날짜의 말씀이 삭제되었습니다.' });
      });
    });
  });
});


// === Word Sharing API ===
const sanitizeShare = (row) => {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
};

app.get('/api/word-shares/:date', (req, res) => {
  const date = req.params.date;
  const sql = `SELECT id, date, authorName, content, createdAt, updatedAt FROM word_shares WHERE date = ? ORDER BY createdAt ASC`;
  db.all(sql, [date], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'success', data: rows.map(sanitizeShare) });
  });
});

app.post('/api/word-shares', (req, res) => {
  const { date, authorName, password, content } = req.body;

  if (!date || !authorName || !password || !content) {
    return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
  }

  bcrypt.hash(password, SALT_ROUNDS, (hashErr, hash) => {
    if (hashErr) {
      return res.status(500).json({ message: hashErr.message });
    }

    const sql = `INSERT INTO word_shares (date, authorName, password, content) VALUES (?, ?, ?, ?)`;
    db.run(sql, [date, authorName, hash, content], function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      db.get(`SELECT id, date, authorName, content, createdAt, updatedAt FROM word_shares WHERE id = ?`, [this.lastID], (fetchErr, row) => {
        if (fetchErr) {
          return res.status(500).json({ message: fetchErr.message });
        }
        res.status(201).json({ message: '나눔이 등록되었습니다.', data: sanitizeShare(row) });
      });
    });
  });
});

app.put('/api/word-shares/:id', (req, res) => {
  const { id } = req.params;
  const { password, content } = req.body;

  if (!password || !content) {
    return res.status(400).json({ message: '내용과 비밀번호를 입력해 주세요.' });
  }

  db.get('SELECT * FROM word_shares WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    bcrypt.compare(password, row.password, (compareErr, isMatch) => {
      if (compareErr) {
        return res.status(500).json({ message: compareErr.message });
      }
      if (!isMatch) {
        return res.status(403).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      const sql = `UPDATE word_shares SET content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(sql, [content, id], function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ message: updateErr.message });
        }
        db.get(`SELECT id, date, authorName, content, createdAt, updatedAt FROM word_shares WHERE id = ?`, [id], (fetchErr, updatedRow) => {
          if (fetchErr) {
            return res.status(500).json({ message: fetchErr.message });
          }
          res.json({ message: '게시글이 수정되었습니다.', data: sanitizeShare(updatedRow) });
        });
      });
    });
  });
});

app.delete('/api/word-shares/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: '비밀번호를 입력해 주세요.' });
  }

  db.get('SELECT * FROM word_shares WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    bcrypt.compare(password, row.password, (compareErr, isMatch) => {
      if (compareErr) {
        return res.status(500).json({ message: compareErr.message });
      }
      if (!isMatch) {
        return res.status(403).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      db.run('DELETE FROM word_shares WHERE id = ?', [id], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ message: deleteErr.message });
        }
        res.json({ message: '게시글이 삭제되었습니다.' });
      });
    });
  });
});


// === Daily Photos API ===

// 날짜별 사진 업로드 (하루에 하나만)
app.post('/api/daily-photos', authMiddleware, upload.single('image'), (req, res) => {
  const { date } = req.body; // YYYY-MM-DD format
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const userId = req.user.id;

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image is required' });
  }

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const sql = `INSERT OR REPLACE INTO daily_photos (date, imageUrl, uploadedBy) VALUES (?, ?, ?)`;
  db.run(sql, [date, imageUrl, userId], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      message: 'Daily photo uploaded successfully',
      data: { id: this.lastID, date, imageUrl, uploadedBy: userId }
    });
  });
});

// 날짜별 사진 가져오기
app.get('/api/daily-photos/:date', authMiddleware, (req, res) => {
  const date = req.params.date;
  const sql = `SELECT * FROM daily_photos WHERE date = ?`;

  db.get(sql, [date], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'success', data: row });
  });
});

// 모든 날짜별 사진과 댓글 개수 가져오기 (달력용)
app.get('/api/daily-photos/counts/all', authMiddleware, (req, res) => {
  const sql = `
    SELECT
      dp.date,
      dp.id,
      COUNT(c.id) as commentCount
    FROM daily_photos dp
    LEFT JOIN comments c ON dp.id = c.dailyPhotoId
    GROUP BY dp.date, dp.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const dates = rows.reduce((acc, row) => {
      acc[row.date] = row.commentCount;
      return acc;
    }, {});
    res.json({ message: 'success', data: dates });
  });
});

// === Comments API ===

// 댓글 작성
app.post('/api/comments', authMiddleware, (req, res) => {
  const { dailyPhotoId, content } = req.body;
  const userId = req.user.id;

  if (!dailyPhotoId || !content) {
    return res.status(400).json({ message: 'Daily photo ID and content are required' });
  }

  const sql = `INSERT INTO comments (dailyPhotoId, content, userId) VALUES (?, ?, ?)`;
  db.run(sql, [dailyPhotoId, content, userId], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      message: 'Comment created successfully',
      data: { id: this.lastID, dailyPhotoId, content, userId }
    });
  });
});

// 특정 사진의 모든 댓글 가져오기
app.get('/api/comments/:dailyPhotoId', authMiddleware, (req, res) => {
  const dailyPhotoId = req.params.dailyPhotoId;
  const sql = `
    SELECT c.*, u.username
    FROM comments c
    JOIN users u ON c.userId = u.id
    WHERE c.dailyPhotoId = ?
    ORDER BY c.createdAt ASC
  `;

  db.all(sql, [dailyPhotoId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'success', data: rows });
  });
});

// 댓글 삭제 (본인만)
app.delete('/api/comments/:id', authMiddleware, (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;

  // Check if comment belongs to user
  db.get('SELECT * FROM comments WHERE id = ? AND userId = ?', [commentId, userId], (err, comment) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!comment) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: 'Comment deleted successfully' });
    });
  });
});

// === Calendar Summary API ===
app.get('/api/calendar/summary', (req, res) => {
  const summary = {};

  // 1. Get dates with daily words
  db.all('SELECT date FROM daily_words', [], (err, wordRows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    wordRows.forEach((row) => {
      if (!summary[row.date]) {
        summary[row.date] = { hasWord: false, shareCount: 0 };
      }
      summary[row.date].hasWord = true;
    });

    // 2. Get share counts by date
    db.all('SELECT date, COUNT(*) as count FROM word_shares GROUP BY date', [], (err, shareRows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      shareRows.forEach((row) => {
        if (!summary[row.date]) {
          summary[row.date] = { hasWord: false, shareCount: 0 };
        }
        summary[row.date].shareCount = row.count;
      });

      res.json({ message: 'success', data: summary });
    });
  });
});

// === Gallery API (사진 공유 갤러리) ===
const sanitizeGallery = (row) => {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
};

// 모든 갤러리 사진 가져오기
app.get('/api/gallery', (req, res) => {
  const sql = `SELECT id, authorName, title, imageUrl, createdAt FROM gallery ORDER BY createdAt DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'success', data: rows.map(sanitizeGallery) });
  });
});

// 갤러리에 사진 업로드 (PROTECTED)
app.post('/api/gallery', authMiddleware, upload.single('image'), (req, res) => {
  const { title } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const userId = req.user.id;
  const username = req.user.username;

  if (!imageUrl) {
    return res.status(400).json({ message: '사진을 선택해 주세요.' });
  }

  const sql = `INSERT INTO gallery (authorName, title, imageUrl, userId) VALUES (?, ?, ?, ?)`;
  db.run(sql, [username, title || '', imageUrl, userId], function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    db.get(`SELECT id, authorName, title, imageUrl, createdAt FROM gallery WHERE id = ?`, [this.lastID], (fetchErr, row) => {
      if (fetchErr) {
        return res.status(500).json({ message: fetchErr.message });
      }
      res.status(201).json({ message: '사진이 등록되었습니다.', data: sanitizeGallery(row) });
    });
  });
});

// 갤러리 사진 삭제 (PROTECTED - 본인 사진만)
app.delete('/api/gallery/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM gallery WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다.' });
    }

    // Check if the photo belongs to the current user
    if (row.userId !== userId) {
      return res.status(403).json({ message: '본인의 사진만 삭제할 수 있습니다.' });
    }

    db.run('DELETE FROM gallery WHERE id = ?', [id], function (deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ message: deleteErr.message });
      }
      res.json({ message: '사진이 삭제되었습니다.' });
    });
  });
});

// Serve frontend static files (for production deployment)
const frontendPath = path.join(__dirname, '../dongsung-deploy');
app.use(express.static(frontendPath));

// Naver site verification - serve before SPA fallback
app.get('/naverd0012c3e43b1ecec615e372fd61ba81b.html', (req, res) => {
  const verificationFile = path.join(__dirname, '../public/naverd0012c3e43b1ecec615e372fd61ba81b.html');
  res.sendFile(verificationFile);
});

// SPA fallback - serve index.html for all non-API routes
app.get('/{*path}', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
