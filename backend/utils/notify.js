const { getPool, sql } = require('../db');

async function createNotification(title, description, type, related_id = null) {
  const pool = await getPool();
  await pool.request()
   .input('title', sql.VarChar, title)
   .input('description', sql.VarChar, description)
   .input('type', sql.VarChar, type)
   .input('related_id', sql.Int, related_id)
   .query('INSERT INTO notifications (title, description, type, related_id) VALUES (@title, @description, @type, @related_id)');
}
module.exports = { createNotification };