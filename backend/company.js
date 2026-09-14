const express = require('express');
const router = express.Router();
const sql = require('mssql/msnodesqlv8');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// DB Config - same as server.js
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=U3IT2\\BCDEMO;Database=recru;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;',
};
async function getPool() {
  return await sql.connect(dbConfig);
}

// Upload folder check
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MULTER - sirf is file ke liye
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'logo-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image allowed'), false);
  }
});

console.log("✅ company.js loaded");

// GET - Company data lao
router.get('/company', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM company_settings WHERE id=1");
    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error("GET COMPANY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST - Company save karo
router.post('/company', async (req, res) => {
  try {
    const { companyName, gstin, address, hrEmail, phone, logoUrl } = req.body;
    console.log("SAVE BODY:", req.body);
    const pool = await getPool();
    await pool.request()
   .input('companyName', sql.NVarChar, companyName || '')
   .input('gstin', sql.NVarChar, gstin || null)
   .input('address', sql.NVarChar, address || '')
   .input('hrEmail', sql.NVarChar, hrEmail || '')
   .input('phone', sql.NVarChar, phone || '')
   .input('logoUrl', sql.NVarChar(sql.MAX), logoUrl || null)
   .query(`
        MERGE company_settings AS t USING (SELECT 1 AS id) AS s ON t.id=s.id
        WHEN MATCHED THEN UPDATE SET
          companyName=@companyName, gstin=@gstin, address=@address,
          hrEmail=@hrEmail, phone=@phone,
          logoUrl=ISNULL(@logoUrl, t.logoUrl),
          updatedAt=GETDATE()
        WHEN NOT MATCHED THEN INSERT (id, companyName, gstin, address, hrEmail, phone, logoUrl)
        VALUES (1, @companyName, @gstin, @address, @hrEmail, @phone, @logoUrl);
      `);
    res.json({ success: true });
  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST - LOGO UPLOAD - YEHI TERA MAIN FIX HAI
router.post('/company/logo', upload.single('logo'), async (req, res) => {
  try {
    console.log("LOGO API HIT");
    console.log("FILE:", req.file);
    if (!req.file) {
      return res.status(400).json({ error: "File nahi aayi, multer ne reject kar di" });
    }
    const logoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    const pool = await getPool();
    await pool.request()
    .input('logoUrl', sql.NVarChar, logoUrl)
    .query("UPDATE company_settings SET logoUrl=@logoUrl, updatedAt=GETDATE() WHERE id=1");

    console.log("Logo saved to DB:", logoUrl);
    res.json({ success: true, logoUrl });
  } catch (err) {
    console.error("LOGO UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;