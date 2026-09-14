const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// GET /api/notifications - sab notifications
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
     .query('SELECT TOP 50 * FROM notifications ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/notifications - naya notification create karo
router.post('/', async (req, res) => {
  try {
    const { title, description, type, related_id } = req.body;
    const pool = await getPool();
    const result = await pool.request()
     .input('title', sql.VarChar, title)
     .input('description', sql.VarChar, description)
     .input('type', sql.VarChar, type)
     .input('related_id', sql.Int, related_id || null)
     .query('INSERT INTO notifications (title, description, type, related_id) OUTPUT INSERTED.* VALUES (@title, @description, @type, @related_id)');
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/notifications/read-all - sab read mark
router.put('/read-all', async (req, res) => {
  const pool = await getPool();
  await pool.request().query('UPDATE notifications SET is_read=1');
  res.json({ success: true });
});

module.exports = router;