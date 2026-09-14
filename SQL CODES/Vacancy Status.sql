use recru
select * from Vacancies;
SELECT definition
FROM sys.check_constraints
WHERE name = 'CK__Vacancies__Statu__49C3F6B7';

-- Purana constraint hatao
ALTER TABLE dbo.Vacancies DROP CONSTRAINT CK__Vacancies__Statu__49C3F6B7;

-- Naya constraint banao tumhare 8 status ke saath
ALTER TABLE dbo.Vacancies
ADD CONSTRAINT CK_Vacancies_Status
CHECK (Status IN ('Active','Published','Draft','On Hold','Closed','Filled','Expired','Cancelled'));