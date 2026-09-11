-- =============================================
-- Database: recru
-- Created for SSMS - Normalized Vacancy Schema
-- =============================================

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'recru')
BEGIN
    CREATE DATABASE recru;
END
GO

USE recru;
GO

-- ==================================================================
-- 1.             MASTER TABLES (To avoid repetition)
-- ==================================================================

-- Department Master (e.g. Engineering, Sales, HR)
CREATE TABLE Master_Departments (
    DepartmentId INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Employment Type Master (Full-time, Part-time, Contract, Internship)
CREATE TABLE Master_EmploymentTypes (
    EmploymentTypeId INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(50) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Workspace Master (On-site, Remote, Hybrid)
CREATE TABLE Master_Workspaces (
    WorkspaceId INT IDENTITY(1,1) PRIMARY KEY,
    WorkspaceName NVARCHAR(50) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Experience Level Master
CREATE TABLE Master_ExperienceLevels (
    ExperienceLevelId INT IDENTITY(1,1) PRIMARY KEY,
    LevelName NVARCHAR(100) NOT NULL UNIQUE, -- e.g. Mid-level (3-5 years)
    MinYears INT NULL,
    MaxYears INT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Skills Master (React.js, Tailwind, etc) - Highly reusable
CREATE TABLE Master_Skills (
    SkillId INT IDENTITY(1,1) PRIMARY KEY,
    SkillName NVARCHAR(100) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Qualifications Master (B.Tech in CSE, MCA, etc)
CREATE TABLE Master_Qualifications (
    QualificationId INT IDENTITY(1,1) PRIMARY KEY,
    QualificationName NVARCHAR(200) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Location Master (Optional but useful to avoid typos like Mohali, Dera Bassi)
CREATE TABLE Master_Locations (
    LocationId INT IDENTITY(1,1) PRIMARY KEY,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NULL,
    Country NVARCHAR(100) DEFAULT 'India',
    UNIQUE(City, State),
    IsActive BIT NOT NULL DEFAULT 1
);

-- =====================================================================================================
-- 2.                                             MAIN VACANCY TABLE
-- =====================================================================================================
CREATE TABLE Vacancies (
    VacancyId INT IDENTITY(1000,1) PRIMARY KEY, -- Starts from 1000 for Auto-Generated ID look
    JobTitle NVARCHAR(200) NOT NULL,
    
    DepartmentId INT NOT NULL,
    EmploymentTypeId INT NOT NULL DEFAULT 1,
    WorkspaceId INT NOT NULL DEFAULT 3,
    LocationId INT NULL, -- FK to Master_Locations
    LocationText NVARCHAR(200) NULL, -- Fallback if location not in master, e.g. "Mohali, Punjab"

    JobSummary NVARCHAR(MAX) NOT NULL,
    ExperienceLevelId INT NOT NULL,

    MinSalary DECIMAL(12,2) NULL CHECK (MinSalary >= 0),
    MaxSalary DECIMAL(12,2) NULL CHECK (MaxSalary >= 0),
    Currency CHAR(3) NOT NULL DEFAULT 'INR',
    IsSalaryPublic BIT NOT NULL DEFAULT 1,

    Status NVARCHAR(20) NOT NULL DEFAULT 'Published' CHECK (Status IN ('Draft','Published','Closed','Archived')),
    
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Vacancies_Department FOREIGN KEY (DepartmentId) REFERENCES Master_Departments(DepartmentId),
    CONSTRAINT FK_Vacancies_EmploymentType FOREIGN KEY (EmploymentTypeId) REFERENCES Master_EmploymentTypes(EmploymentTypeId),
    CONSTRAINT FK_Vacancies_Workspace FOREIGN KEY (WorkspaceId) REFERENCES Master_Workspaces(WorkspaceId),
    CONSTRAINT FK_Vacancies_ExperienceLevel FOREIGN KEY (ExperienceLevelId) REFERENCES Master_ExperienceLevels(ExperienceLevelId),
    CONSTRAINT FK_Vacancies_Location FOREIGN KEY (LocationId) REFERENCES Master_Locations(LocationId),
    CONSTRAINT CHK_SalaryRange CHECK (MaxSalary IS NULL OR MinSalary IS NULL OR MaxSalary >= MinSalary)
);

-- =================================================================================================
-- 3.                              CHILD / JUNCTION TABLES
-- =================================================================================================

-- Responsibilities are specific to each vacancy (1-to-Many)
CREATE TABLE Vacancy_Responsibilities (
    ResponsibilityId INT IDENTITY(1,1) PRIMARY KEY,
    VacancyId INT NOT NULL,
    ResponsibilityText NVARCHAR(500) NOT NULL,
    SortOrder INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Resp_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE CASCADE
);

-- Qualifications Mapping (Many-to-Many: Vacancy can have many qualifications)
CREATE TABLE Vacancy_Qualifications (
    VacancyQualificationId INT IDENTITY(1,1) PRIMARY KEY,
    VacancyId INT NOT NULL,
    QualificationId INT NOT NULL,
    IsRequired BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_VQ_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE CASCADE,
    CONSTRAINT FK_VQ_Qualification FOREIGN KEY (QualificationId) REFERENCES Master_Qualifications(QualificationId),
    CONSTRAINT UQ_Vacancy_Qualification UNIQUE (VacancyId, QualificationId)
);

-- Skills Mapping (Many-to-Many: Vacancy can have many skills)
CREATE TABLE Vacancy_Skills (
    VacancySkillId INT IDENTITY(1,1) PRIMARY KEY,
    VacancyId INT NOT NULL,
    SkillId INT NOT NULL,
    IsRequired BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_VS_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE CASCADE,
    CONSTRAINT FK_VS_Skill FOREIGN KEY (SkillId) REFERENCES Master_Skills(SkillId),
    CONSTRAINT UQ_Vacancy_Skill UNIQUE (VacancyId, SkillId)
);

-- ===============================================================================================================
-- 4.                                                     SEED MASTER DATA
-- ===============================================================================================================
INSERT INTO Master_EmploymentTypes (TypeName) VALUES ('Full-time'), ('Part-time'), ('Contract'), ('Internship');
INSERT INTO Master_Workspaces (WorkspaceName) VALUES ('On-site'), ('Remote'), ('Hybrid');
INSERT INTO Master_ExperienceLevels (LevelName, MinYears, MaxYears) VALUES 
('Entry-level (0-2 years)', 0, 2),
('Mid-level (3-5 years)', 3, 5),
('Senior (5-8 years)', 5, 8),
('Lead / Executive (8+ years)', 8, 20);

INSERT INTO Master_Departments (DepartmentName) VALUES ('Engineering'), ('Sales'), ('HR'), ('Marketing'), ('Finance');
INSERT INTO Master_Locations (City, State) VALUES ('Mohali', 'Punjab'), ('Dera Bassi', 'Punjab'), ('Chandigarh', 'Chandigarh'), ('Remote', NULL);

INSERT INTO Master_Skills (SkillName) VALUES ('React.js'), ('Node.js'), ('Tailwind CSS'), ('SQL Server'), ('C#'), ('.NET'), ('JavaScript');
INSERT INTO Master_Qualifications (QualificationName) VALUES ('B.Tech in CSE'), ('MCA'), ('MBA'), ('BCA'), ('Diploma');

-- =================================================================================================================
-- 5.                                                   INDEXES FOR PERFORMANCE
-- =================================================================================================================
CREATE INDEX IX_Vacancies_Department ON Vacancies(DepartmentId);
CREATE INDEX IX_Vacancies_Location ON Vacancies(LocationId);
CREATE INDEX IX_Vacancies_Status ON Vacancies(Status);
CREATE INDEX IX_Vacancy_Skills_SkillId ON Vacancy_Skills(SkillId);

-- ================================================================================================================
-- 6.                                         SAMPLE INSERT - How your React form will save
-- ================================================================================================================
/*
-- Example from your React payload:
DECLARE @NewVacancyId INT;

INSERT INTO Vacancies (JobTitle, DepartmentId, EmploymentTypeId, WorkspaceId, LocationText, JobSummary, ExperienceLevelId, MinSalary, MaxSalary, IsSalaryPublic)
VALUES ('Senior Full Stack Developer', 1, 1, 3, 'Mohali, Punjab', 'Build and maintain web apps...', 2, 500000, 900000, 1);

SET @NewVacancyId = SCOPE_IDENTITY();

INSERT INTO Vacancy_Responsibilities (VacancyId, ResponsibilityText, SortOrder) VALUES (@NewVacancyId, 'Develop frontend with React', 1);
INSERT INTO Vacancy_Qualifications (VacancyId, QualificationId) VALUES (@NewVacancyId, 1);
INSERT INTO Vacancy_Skills (VacancyId, SkillId) VALUES (@NewVacancyId, 1), (@NewVacancyId, 4);

-- To fetch full vacancy with all masters:
SELECT 
    v.VacancyId, v.JobTitle, d.DepartmentName, et.TypeName, ws.WorkspaceName, 
    v.LocationText, v.JobSummary, el.LevelName, v.MinSalary, v.MaxSalary
FROM Vacancies v
JOIN Master_Departments d ON v.DepartmentId = d.DepartmentId
JOIN Master_EmploymentTypes et ON v.EmploymentTypeId = et.EmploymentTypeId
JOIN Master_Workspaces ws ON v.WorkspaceId = ws.WorkspaceId
JOIN Master_ExperienceLevels el ON v.ExperienceLevelId = el.ExperienceLevelId
WHERE v.VacancyId = @NewVacancyId;
*/
GO
