-- FIX 3: Interviews table tumhare naye Vacancy_Applications ke hisab se
IF OBJECT_ID('Interviews', 'U') IS NOT NULL DROP TABLE Interviews;
GO

CREATE TABLE Interviews (
    InterviewId INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationId INT NOT NULL, -- FK to Vacancy_Applications(ApplicationId)
    VacancyId INT NOT NULL, -- FK to Vacancies(VacancyId) -> ab INT hai

    -- Date Time
    InterviewDate DATE NOT NULL,
    InterviewTime TIME NOT NULL,
    Duration INT NOT NULL DEFAULT 60, -- minutes

    -- Interview Details
    InterviewType NVARCHAR(50) NOT NULL DEFAULT 'Technical',
    Round NVARCHAR(50) NOT NULL DEFAULT 'Round 1',
    Mode NVARCHAR(20) NOT NULL CHECK (Mode IN ('Onsite','Virtual','Telephonic')),

    -- Onsite fields
    Venue NVARCHAR(255), -- Dera Bassi Office
    Building NVARCHAR(100),
    FloorRoom NVARCHAR(100),

    -- Virtual fields
    Platform NVARCHAR(50), -- Google Meet, Zoom
    MeetingLink NVARCHAR(500),
    MeetingId NVARCHAR(200),
    Passcode NVARCHAR(100),

    Interviewer NVARCHAR(255),
    Notes NVARCHAR(MAX),
    Status NVARCHAR(20) DEFAULT 'Scheduled' CHECK (Status IN ('Scheduled','Completed','Cancelled','Rescheduled')),

    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),

    -- Foreign Keys tumhare naye table se match karte hue
    CONSTRAINT FK_Interviews_App FOREIGN KEY (ApplicationId) REFERENCES Vacancy_Applications(ApplicationId) ON DELETE CASCADE,
    CONSTRAINT FK_Interviews_Vacancy FOREIGN KEY (VacancyId) REFERENCES Vacancies(VacancyId) ON DELETE NO ACTION
);

-- Indexes for fast filtering on your Interviews page
CREATE INDEX IX_Interviews_VacancyId ON Interviews(VacancyId);
CREATE INDEX IX_Interviews_ApplicationId ON Interviews(ApplicationId);
CREATE INDEX IX_Interviews_Date ON Interviews(InterviewDate);
GO

-- Saare scheduled interviews dekho
SELECT
  i.InterviewId,
  va.ApplicationId,
  CONCAT(c.first_name, ' ', c.last_name) as CandidateName,
  v.JobTitle,
  i.InterviewDate,
  i.InterviewTime,
  i.Mode,
  i.Venue,
  i.MeetingLink,
  i.Interviewer,
  i.Status
FROM Interviews i
JOIN Vacancy_Applications va ON va.ApplicationId = i.ApplicationId
JOIN candidates c ON c.id = va.CandidateId
JOIN Vacancies v ON v.VacancyId = i.VacancyId
ORDER BY i.InterviewDate DESC, i.InterviewTime DESC;