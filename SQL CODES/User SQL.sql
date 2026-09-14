use recru
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100),
  email NVARCHAR(100) UNIQUE,
  mobile NVARCHAR(15),
  password NVARCHAR(100),
  role NVARCHAR(50),
  avatar NVARCHAR(255),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME NULL
);
select * from users