// routes/settings.js
const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db'); // db.js import
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = "usha_yarns_secret_2026";

// Avatar upload setup
const storage = multer.diskStorage({
  destination: 'uploads/avatars/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET /api/settings/users
router.get('/users', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id, name, email, mobile, role, avatar FROM users ORDER BY id DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/users - Create User
router.post('/users', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;
    const avatarPath = req.file? `/uploads/avatars/${req.file.filename}` : null;

    // Password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    const pool = await getPool();
    const result = await pool.request()
     .input('name', sql.VarChar, name)
     .input('email', sql.VarChar, email)
     .input('mobile', sql.VarChar, mobile)
     .input('password', sql.VarChar, hashedPassword)
     .input('role', sql.VarChar, role)
     .input('avatar', sql.VarChar, avatarPath)
     .query('INSERT INTO users (name, email, mobile, password, role, avatar, updated_at) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.mobile, INSERTED.role, INSERTED.avatar VALUES (@name, @email, @mobile, @password, @role, @avatar)');

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/users/:id - Update user
router.put('/users/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, mobile, role } = req.body;
    const pool = await getPool();
    const request = pool.request()
     .input('id', sql.Int, req.params.id)
     .input('name', sql.VarChar, name)
     .input('email', sql.VarChar, email)
     .input('mobile', sql.VarChar, mobile)
     .input('role', sql.VarChar, role);

    if (req.file) {
      request.input('avatar', sql.VarChar, `/uploads/avatars/${req.file.filename}`);
      await request.query('UPDATE users SET name=@name, email=@email, mobile=@mobile, role=@role, avatar=@avatar, updated_at=GETDATE() WHERE id=@id');
    } else {
      await request.query('UPDATE users SET name=@name, email=@email, mobile=@mobile, role=@role, updated_at=GETDATE() WHERE id=@id');
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM users WHERE id = @id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== LOGIN ==============
// POST /api/settings/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await getPool();
    const result = await pool.request().input('email', sql.VarChar, email).query('SELECT * FROM users WHERE email = @email');
    const user = result.recordset[0];

    if (!user) return res.status(401).json({ message: "User nahi mila" });

    // Old plain password + new hash dono support
    let isMatch = false;
    if (user.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
      // purane plain password ko hash me convert kar do
      if (isMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await pool.request().input('id', sql.Int, user.id).input('password', sql.VarChar, newHash).query('UPDATE users SET password=@password WHERE id=@id');
      }
    }

    if (!isMatch) return res.status(401).json({ message: "Password galat hai" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== GET LOGGED IN USER ==============
// GET /api/settings/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Token nahi hai" });

    const decoded = jwt.verify(token, SECRET);
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, decoded.id).query('SELECT id, name, email, mobile, role, avatar FROM users WHERE id=@id');

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
});

module.exports = router;