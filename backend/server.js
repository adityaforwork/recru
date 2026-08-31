const express = require('express');
const cors = require('cors')
const sql = require('mssql/msnodesqlv8');

const app = express();
app.use(cors())
app.use(express.json()); // Allows your server to read incoming JSON data

// SQL Server configurations using Windows Authentication
const dbConfig = {
 connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=localhost;Database=recru;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;',
 options: {
  trustServerCertificate: true
 }
};

// 🗺️ API Route 1: Get all records from users table
app.get('/api/users', async (req, res) => {
 try {
  let pool = await sql.connect(dbConfig);
  let result = await pool.request().query("SELECT * FROM users");
  res.json(result.recordset);
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

// 📥 API Route 2: Insert a new user record into the table
app.post('/api/users', async (req, res) => {
 const { id, name } = req.body;
 try {
  let pool = await sql.connect(dbConfig);
  await pool.request()
   .input('userId', sql.Int, id)
   .input('userName', sql.VarChar, name)
   .query("INSERT INTO users (id, name) VALUES (@userId, @userName)");

  res.status(201).json({ message: "🎉 User added successfully!" });
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
 console.log(`🚀 Backend server is running smoothly on http://localhost:${PORT}`);
});
