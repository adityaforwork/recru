-- FIX 2: Vacancy_Applications ko sahi stages ke saath
IF OBJECT_ID('Application_Stage_History', 'U') IS NOT NULL DROP TABLE Application_Stage_History;
IF OBJECT_ID('Vacancy_Applications', 'U') IS NOT NULL DROP TABLE Vacancy_Applications;
GO

CREATE TABLE Vacancy_Applications (
  ApplicationId INT IDENTITY(1,1) PRIMARY KEY,
  VacancyId INT NOT NULL,
  CandidateId INT NOT NULL,
  CurrentStage NVARCHAR(50) NOT NULL DEFAULT 'Applied', -- Screening nahi, Applied hona chahiye first stage
  AppliedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_VA_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE CASCADE,
  CONSTRAINT FK_VA_Candidate FOREIGN KEY (CandidateId) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT UQ_Vacancy_Candidate UNIQUE (VacancyId, CandidateId),
  CONSTRAINT CK_VA_Stage CHECK (CurrentStage IN ('Applied','Screening','Interview','Offer','Hired','Rejected','On Hold'))
);

CREATE TABLE Application_Stage_History (
  HistoryId INT IDENTITY(1,1) PRIMARY KEY,
  ApplicationId INT NOT NULL,
  FromStage NVARCHAR(50), ToStage NVARCHAR(50),
  Notes NVARCHAR(500), ChangedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_History_App FOREIGN KEY (ApplicationId) REFERENCES Vacancy_Applications(ApplicationId) ON DELETE CASCADE
);
GO