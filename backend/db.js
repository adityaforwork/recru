// db.js
const sql = require('mssql/msnodesqlv8');

const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=U3IT2\\BCDEMO;Database=recru;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;',
};

let pool;
async function getPool() {
  if (pool && pool.connected) return pool;
  pool = await sql.connect(dbConfig);
  return pool;
}

module.exports = { getPool, sql };