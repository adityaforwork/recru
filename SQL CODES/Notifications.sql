CREATE TABLE notifications (
  id INT IDENTITY(1,1) PRIMARY KEY,
  title VARCHAR(255),
  description VARCHAR(500),
  type VARCHAR(50), -- 'candidate', 'vacancy', 'interview'
  related_id INT NULL,
  is_read BIT DEFAULT 0,
  created_for_role VARCHAR(50) NULL, -- 'Recruiter', 'Admin' ya NULL = sabke liye
  created_at DATETIME DEFAULT GETDATE()
);