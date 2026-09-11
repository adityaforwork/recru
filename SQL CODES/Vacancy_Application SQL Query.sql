USE recru;
GO

-- Agar purani table bani hui hai to pehle delete karo
IF OBJECT_ID('Application_Stage_History', 'U') IS NOT NULL DROP TABLE Application_Stage_History;
IF OBJECT_ID('Vacancy_Applications', 'U') IS NOT NULL DROP TABLE Vacancy_Applications;
GO

CREATE TABLE Vacancy_Applications (
  ApplicationId INT IDENTITY(1,1) PRIMARY KEY,
  VacancyId INT NOT NULL,
  CandidateId INT NOT NULL,
  CurrentStage NVARCHAR(50) NOT NULL DEFAULT 'Applied',
  AppliedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(), -- YAHI NAYA ADD KIYA

  CONSTRAINT FK_VA_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE CASCADE,
  CONSTRAINT FK_VA_Candidate FOREIGN KEY (CandidateId) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT UQ_Vacancy_Candidate UNIQUE (VacancyId, CandidateId)
);
GO

CREATE TABLE Application_Stage_History (
  HistoryId INT IDENTITY(1,1) PRIMARY KEY,
  ApplicationId INT NOT NULL,
  FromStage NVARCHAR(50),
  ToStage NVARCHAR(50),
  Notes NVARCHAR(500),
  ChangedAt DATETIME2 DEFAULT GETDATE(),

  CONSTRAINT FK_History_App FOREIGN KEY (ApplicationId) REFERENCES Vacancy_Applications(ApplicationId) ON DELETE CASCADE
);
GO

-- Auto UpdatedAt update karne ke liye Trigger
CREATE TRIGGER trg_Vacancy_Applications_UpdateTime
ON Vacancy_Applications
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE va
  SET UpdatedAt = GETDATE()
  FROM Vacancy_Applications va
  INNER JOIN inserted i ON va.ApplicationId = i.ApplicationId;
END;
GO