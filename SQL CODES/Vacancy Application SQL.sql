USE recru;
GO

-- FIX 1: Status ka purana constraint hatao aur naya wala lagao (tumhare 8 status ke liye)
-- Agar error aaye "constraint not found" to next line pe jao
DECLARE @chk NVARCHAR(200) = (SELECT name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('Vacancies') AND definition LIKE '%Status%');
IF @chk IS NOT NULL EXEC('ALTER TABLE Vacancies DROP CONSTRAINT ' + @chk);

ALTER TABLE Vacancies ADD CONSTRAINT CK_Vacancies_Status 
CHECK (Status IN ('Active','Published','Draft','On Hold','Closed','Filled','Expired','Cancelled'));
GO

-- FIX 2: Agar Vacancy_Applications table purani hai to usko sahi FK ke saath recreate karo
-- Ye candidates ka data delete nahi karega
IF OBJECT_ID('Application_Stage_History', 'U') IS NOT NULL DROP TABLE Application_Stage_History;
IF OBJECT_ID('Vacancy_Applications', 'U') IS NOT NULL DROP TABLE Vacancy_Applications;
GO

CREATE TABLE Vacancy_Applications (
  ApplicationId INT IDENTITY(1,1) PRIMARY KEY,
  VacancyId INT NOT NULL,
  CandidateId INT NOT NULL,
  CurrentStage NVARCHAR(50) NOT NULL DEFAULT 'Screening',
  AppliedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_VA_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE CASCADE,
  CONSTRAINT FK_VA_Candidate FOREIGN KEY (CandidateId) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT UQ_Vacancy_Candidate UNIQUE (VacancyId, CandidateId)
);

CREATE TABLE Application_Stage_History (
  HistoryId INT IDENTITY(1,1) PRIMARY KEY,
  ApplicationId INT NOT NULL,
  FromStage NVARCHAR(50), ToStage NVARCHAR(50),
  Notes NVARCHAR(500), ChangedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_History_App FOREIGN KEY (ApplicationId) REFERENCES Vacancy_Applications(ApplicationId) ON DELETE CASCADE
);
GO

-- FIX 3: Check karo tables sahi hai ya nahi
SELECT VacancyId, JobTitle, Status FROM Vacancies;
SELECT COUNT(*) as total_applications FROM Vacancy_Applications;
GO