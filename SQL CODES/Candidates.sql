-- Purana data hai to delete karne ke liye
-- DROP TABLE IF EXISTS candidate_skills;
-- DROP TABLE IF EXISTS skills;
-- DROP TABLE IF EXISTS candidates;
-- GO

-- 1. MAIN CANDIDATE TABLE
CREATE TABLE candidates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    current_location VARCHAR(150) NOT NULL,
    highest_qualification VARCHAR(150),
    applied_role VARCHAR(150) NOT NULL,
    current_employer VARCHAR(150),
    experience_years DECIMAL(4,1),
    current_ctc INT,
    expected_ctc INT,
    notice_period VARCHAR(50),
    application_source VARCHAR(50),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    resume_path VARCHAR(255),
    recruiter_notes TEXT,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 2. SKILLS MASTER TABLE
CREATE TABLE skills (
    id INT IDENTITY(1,1) PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. JUNCTION TABLE
CREATE TABLE candidate_skills (
    id INT IDENTITY(1,1) PRIMARY KEY,
    candidate_id INT NOT NULL,
    skill_id INT NOT NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT unique_candidate_skill UNIQUE (candidate_id, skill_id)
);
GO

-- Pehle se kuch common skills daal dete hain
INSERT INTO skills (skill_name) VALUES 
('React.js'), ('Tailwind CSS'), ('Node.js'), ('Python'), ('Java'), ('Figma'), ('JavaScript');
GO
select * from candidates