/**
 * =================================================================================
 * FILE: server.js
 * PROJECT: USHA YARNS LTD - Recruitment Management System (RECRU)
 * DB: SQL Server (U3IT2\BCDEMO) - Database: recru
 * DRIVER: mssql/msnodesqlv8 with ODBC Driver 17 (Windows Authentication)
 * PORT: 5000
 * AUTHOR: Aditya Mishra
 * LAST UPDATED: 2026-09-12
 *
 * STRUCTURE:
 * 1. Config & Helpers (getPool)
 * 2. Vacancy APIs
 * 3. Candidate APIs
 * 4. Application / Pipeline APIs (Screening, Interview, Offer, Hired)
 * 5. Dashboard APIs
 * 6. Global Search API
 * 7. Interview Scheduling APIs
 * =================================================================================
 */
// =================================================================================
// =================================================================================
//                                 Requirements & Initial Setup
// =================================================================================
// =================================================================================
const express = require('express');
const cors = require('cors')
const sql = require('mssql/msnodesqlv8'); // for windows trusted connection 
const { NVarChar } = require('msnodesqlv8');
const multer = require('multer'); // for resume upload
//=================================================================================
// ================================================================================
//                                  Resume upload setup
// ================================================================================
// ================================================================================
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
const app = express();
app.use(cors())
app.use(express.json());
app.use('/uploads', express.static('uploads')); // avatar ke liye
const settingsRoute = require('./routes/settings')
app.use('/api/settings', settingsRoute);
app.use('/api/notifications', require('./routes/notifications'));
const { createNotification } = require('./utils/notify');
// ==========================================================================================================
// ==========================================================================================================
//                                      1. DATABASE CONFIGURATION
// ==========================================================================================================
// ==========================================================================================================
/**
 * dbConfig: SQL Server connection string
 * IMPORTANT: Always use getPool() function, never use sql.connect() directly
 * Reason: sql.connect() without config gives error "Cannot read properties of undefined (reading 'port')"
 */
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=U3IT2\\BCDEMO;Database=recru;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;',
};

async function getPool() {
  return await sql.connect(dbConfig);
}

// ======================================================================================================
// ======================================================================================================
//                                      2. VACANCY APIs START 
// ======================================================================================================
// ======================================================================================================
// 2.1 GET ALL VACANCY MASTER DATA 
// URL: GET /api/masters
// Purpose: Used for the dropdowns in vacancy form (Department, Skills, etc.)
app.get('/api/masters', async (req, res) => {
  try {
    let pool = await getPool();
    let departments = await pool.request().query("SELECT * FROM Master_Departments WHERE IsActive=1");
    let empTypes = await pool.request().query("SELECT * FROM Master_EmploymentTypes WHERE IsActive=1");
    let workspaces = await pool.request().query("SELECT * FROM Master_Workspaces WHERE IsActive=1");
    let expLevels = await pool.request().query("SELECT * FROM Master_ExperienceLevels WHERE IsActive=1");
    let skills = await pool.request().query("SELECT * FROM Master_Skills WHERE IsActive=1");
    let qualifications = await pool.request().query("SELECT * FROM Master_Qualifications WHERE IsActive=1");
    let locations = await pool.request().query("SELECT * FROM Master_Locations WHERE IsActive=1");
    res.json({
      departments: departments.recordset,
      employmentTypes: empTypes.recordset,
      workspaces: workspaces.recordset,
      experienceLevels: expLevels.recordset,
      skills: skills.recordset,
      qualifications: qualifications.recordset,
      locations: locations.recordset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2.2 CREATE NEW VACANCY 
// URL: POST /api/vacancies
// Body: { jobTitle, department, employmentType, workspace, location, jobSummary,... }
app.post('/api/vacancies', async (req, res) => {
  const { jobTitle, department, employmentType, workspace, location, jobSummary, experienceLevel, minSalary, maxSalary, currency, isSalaryPublic, responsibilities, qualifications, skills, status } = req.body;
  let pool; let transaction;
  try {
    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    let deptResult = await request.input('deptName2', sql.NVarChar, department).query("SELECT DepartmentId FROM Master_Departments WHERE DepartmentName=@deptName2");
    let departmentId = deptResult.recordset[0]?.DepartmentId;
    if (!departmentId) {
      let ins = await pool.request().input('d', sql.NVarChar, department).query("INSERT INTO Master_Departments (DepartmentName) OUTPUT INSERTED.DepartmentId VALUES (@d)");
      departmentId = ins.recordset[0].DepartmentId;
    }

    let empTypeResult = await pool.request().input('et', sql.NVarChar, employmentType).query("SELECT EmploymentTypeId FROM Master_EmploymentTypes WHERE TypeName=@et");
    let employmentTypeId = empTypeResult.recordset[0]?.EmploymentTypeId || 1;

    let wsResult = await pool.request().input('ws', sql.NVarChar, workspace).query("SELECT WorkspaceId FROM Master_Workspaces WHERE WorkspaceName=@ws");
    let workspaceId = wsResult.recordset[0]?.WorkspaceId || 3;

    let expResult = await pool.request().input('exp', sql.NVarChar, experienceLevel).query("SELECT ExperienceLevelId FROM Master_ExperienceLevels WHERE LevelName=@exp");
    let experienceLevelId = expResult.recordset[0]?.ExperienceLevelId || 2;

    // SALARY VALIDATION
    let minVal = minSalary ? parseFloat(minSalary) : null;
    let maxVal = maxSalary ? parseFloat(maxSalary) : null;

    if (minVal !== null && maxVal !== null) {
      if (minVal > maxVal) {
        // Auto-swap to avoid CHECK constraint error, or you can throw error
        console.warn(`Swapping salaries: min ${minVal} > max ${maxVal}`);
        let tmp = minVal; minVal = maxVal; maxVal = tmp;
        // If you want to REJECT instead, uncomment below:
        // return res.status(400).json({ error: `Min salary (${minVal}) cannot be greater than Max salary (${maxVal})` });
      }
    }

    //  Status Validation
    const allowedStatus = ['Active', 'Published', 'Draft', 'On Hold', 'Closed', 'Filled', 'Expired', 'Cancalled']
    const finalStatus = allowedStatus.includes(status) ? status : 'Active';

    let vacancyResult = await new sql.Request(transaction)
      .input('jobTitle', sql.NVarChar, jobTitle)
      .input('departmentId', sql.Int, departmentId)
      .input('employmentTypeId', sql.Int, employmentTypeId)
      .input('workspaceId', sql.Int, workspaceId)
      .input('location', sql.NVarChar, location)
      .input('jobSummary', sql.NVarChar, jobSummary)
      .input('experienceLevelId', sql.Int, experienceLevelId)
      .input('minSalary', sql.Decimal(12, 2), minVal)
      .input('maxSalary', sql.Decimal(12, 2), maxVal)
      .input('currency', sql.Char(3), currency || 'INR')
      .input('isSalaryPublic', sql.Bit, isSalaryPublic ? 1 : 0)
      .input('status', sql.NVarChar, finalStatus)
      .query(`INSERT INTO Vacancies (JobTitle, DepartmentId, EmploymentTypeId, WorkspaceId, LocationText, JobSummary, ExperienceLevelId, MinSalary, MaxSalary, Currency, IsSalaryPublic, Status) OUTPUT INSERTED.VacancyId VALUES (@jobTitle, @departmentId, @employmentTypeId, @workspaceId, @location, @jobSummary, @experienceLevelId, @minSalary, @maxSalary, @currency, @isSalaryPublic, @status)`);

    const vacancyId = vacancyResult.recordset[0].VacancyId;

    for (let i = 0; i < responsibilities.length; i++) {
      if (responsibilities[i].trim() !== "") {
        await new sql.Request(transaction).input('vacancyId', sql.Int, vacancyId).input('respText', sql.NVarChar, responsibilities[i]).input('sortOrder', sql.Int, i + 1).query("INSERT INTO Vacancy_Responsibilities (VacancyId, ResponsibilityText, SortOrder) VALUES (@vacancyId, @respText, @sortOrder)");
      }
    }
    for (let skillName of skills) {
      if (skillName.trim() === "") continue;
      let existing = await pool.request().input('sName', sql.NVarChar, skillName).query("SELECT SkillId FROM Master_Skills WHERE SkillName=@sName");
      let skillId;
      if (existing.recordset.length > 0) { skillId = existing.recordset[0].SkillId; } else { let newSkill = await new sql.Request(transaction).input('sName2', sql.NVarChar, skillName).query("INSERT INTO Master_Skills (SkillName) OUTPUT INSERTED.SkillId VALUES (@sName2)"); skillId = newSkill.recordset[0].SkillId; }
      await new sql.Request(transaction).input('vId', sql.Int, vacancyId).input('sId', sql.Int, skillId).query("INSERT INTO Vacancy_Skills (VacancyId, SkillId) VALUES (@vId, @sId)");
    }
    for (let qualName of qualifications) {
      if (qualName.trim() === "") continue;
      let existing = await pool.request().input('qName', sql.NVarChar, qualName).query("SELECT QualificationId FROM Master_Qualifications WHERE QualificationName=@qName");
      let qualId;
      if (existing.recordset.length > 0) { qualId = existing.recordset[0].QualificationId; } else { let newQual = await new sql.Request(transaction).input('qName2', sql.NVarChar, qualName).query("INSERT INTO Master_Qualifications (QualificationName) OUTPUT INSERTED.QualificationId VALUES (@qName2)"); qualId = newQual.recordset[0].QualificationId; }
      await new sql.Request(transaction).input('vId2', sql.Int, vacancyId).input('qId', sql.Int, qualId).query("INSERT INTO Vacancy_Qualifications (VacancyId, QualificationId) VALUES (@vId2, @qId)");
    }

    await transaction.commit();
    res.status(201).json({ message: "Vacancy created!", vacancyId });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2.3 GET ALL VACANCIES 
// Purpose: For Vacancy List Page
app.get('/api/vacancies', async (req, res) => {
  try {
    let pool = await getPool();
    let result = await pool.request().query(`
      SELECT
        v.VacancyId as id,
        v.JobTitle as jobTitle,
        d.DepartmentName as department,
        et.TypeName as employmentType,
        ws.WorkspaceName as workspace,
        ISNULL(v.LocationText, l.City) as location,
        el.LevelName as experienceLevel,
        v.MinSalary as minSalary,
        v.MaxSalary as maxSalary,
        v.IsSalaryPublic as isSalaryPublic,
        v.JobSummary as jobSummary,
        v.Status as status,
        v.CreatedAt as postedDate
      FROM Vacancies v
      JOIN Master_Departments d ON v.DepartmentId = d.DepartmentId
      JOIN Master_EmploymentTypes et ON v.EmploymentTypeId = et.EmploymentTypeId
      JOIN Master_Workspaces ws ON v.WorkspaceId = ws.WorkspaceId
      JOIN Master_ExperienceLevels el ON v.ExperienceLevelId = el.ExperienceLevelId
      LEFT JOIN Master_Locations l ON v.LocationId = l.LocationId
      ORDER BY v.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2.4 GET SINGLE VACANCY DETAIL
// Purpose: To show single vacancy (for search and other)
// Method: GET /api/vacancies/:id
app.get('/api/vacancies/:id', async (req, res) => {
  try {
    let pool = await getPool();
    let id = parseInt(req.params.id);
    let vacancy = await pool.request().input('id', sql.Int, id).query(`
      SELECT
        v.VacancyId as id, v.JobTitle as jobTitle, v.CreatedAt as CreatedAt, d.DepartmentName as department,
        et.TypeName as employmentType, ws.WorkspaceName as workspace,
        ISNULL(v.LocationText, l.City) as location,
        el.LevelName as experienceLevel,
        v.MinSalary as minSalary, v.MaxSalary as maxSalary,
        v.IsSalaryPublic as isSalaryPublic, v.JobSummary as jobSummary,
        v.Status as status, v.CreatedAt as postedDate
      FROM Vacancies v
      JOIN Master_Departments d ON v.DepartmentId = d.DepartmentId
      JOIN Master_EmploymentTypes et ON v.EmploymentTypeId = et.EmploymentTypeId
      JOIN Master_Workspaces ws ON v.WorkspaceId = ws.WorkspaceId
      JOIN Master_ExperienceLevels el ON v.ExperienceLevelId = el.ExperienceLevelId
      LEFT JOIN Master_Locations l ON v.LocationId = l.LocationId
      WHERE v.VacancyId = @id
    `);
    if (vacancy.recordset.length === 0) return res.status(404).json({ error: "Not found" });
    let responsibilities = await pool.request().input('id', sql.Int, id).query("SELECT ResponsibilityText FROM Vacancy_Responsibilities WHERE VacancyId=@id ORDER BY SortOrder");
    let skills = await pool.request().input('id', sql.Int, id).query("SELECT s.SkillName FROM Vacancy_Skills vs JOIN Master_Skills s ON vs.SkillId = s.SkillId WHERE vs.VacancyId=@id");
    let qualifications = await pool.request().input('id', sql.Int, id).query("SELECT q.QualificationName FROM Vacancy_Qualifications vq JOIN Master_Qualifications q ON vq.QualificationId = q.QualificationId WHERE vq.VacancyId=@id");
    let result = vacancy.recordset[0];
    result.responsibilities = responsibilities.recordset.map(r => r.ResponsibilityText);
    result.skills = skills.recordset.map(s => s.SkillName);
    result.qualifications = qualifications.recordset.map(q => q.QualificationName);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2.5 DELETE VACANCY
// Purpose: When Vacancies are no longer available
// Method: DELETE /api/vacancies/:id
app.delete('/api/vacancies/:id', async (req, res) => {
  try {
    let pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id).query("DELETE FROM Vacancies WHERE VacancyId=@id");
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 2.6 Edit VACANCY
// Purpose: When you want to edit an vacancy 
// Method: PUT /api/vacancies/:id
app.put('/api/vacancies/:id', async (req, res) => {
  const { jobTitle, department, employmentType, workspace, location, jobSummary, experienceLevel, minSalary, maxSalary, isSalaryPublic, responsibilities, qualifications, skills, status } = req.body;
  let pool; let transaction;
  try {
    const vacancyId = parseInt(req.params.id);
    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Fetch Master ID's
    let deptResult = await pool.request().input('deptName', sql.NVarChar, department).query("SELECT DepartmentId FROM Master_Departments WHERE DepartmentName=@deptName");
    let departmentId = deptResult.recordset[0]?.DepartmentId;
    if (!departmentId) {
      let ins = await new sql.Request(transaction).input('d', sql.NVarChar, department).query("INSERT INTO Master_Departments (DepartmentName) OUTPUT INSERTED.DepartmentId VALUES (@d)");
      departmentId = ins.recordset[0].DepartmentId;
    }

    let empTypeResult = await pool.request().input('et', sql.NVarChar, employmentType).query("SELECT EmploymentTypeId FROM Master_EmploymentTypes WHERE TypeName=@et");
    let employmentTypeId = empTypeResult.recordset[0]?.EmploymentTypeId || 1;

    let wsResult = await pool.request().input('ws', sql.NVarChar, workspace).query("SELECT WorkspaceId FROM Master_Workspaces WHERE WorkspaceName=@ws");
    let workspaceId = wsResult.recordset[0]?.WorkspaceId || 1;

    let expResult = await pool.request().input('exp', sql.NVarChar, experienceLevel).query("SELECT ExperienceLevelId FROM Master_ExperienceLevels WHERE LevelName=@exp");
    let experienceLevelId = expResult.recordset[0]?.ExperienceLevelId || 2;

    // 1. MAIN TABLE UPDATE
    await new sql.Request(transaction)
      .input('id', sql.Int, vacancyId)
      .input('jobTitle', sql.NVarChar, jobTitle)
      .input('departmentId', sql.Int, departmentId)
      .input('employmentTypeId', sql.Int, employmentTypeId)
      .input('workspaceId', sql.Int, workspaceId)
      .input('location', sql.NVarChar, location)
      .input('jobSummary', sql.NVarChar, jobSummary)
      .input('experienceLevelId', sql.Int, experienceLevelId)
      .input('minSalary', sql.Decimal(12, 2), minSalary ? parseFloat(minSalary) : null)
      .input('maxSalary', sql.Decimal(12, 2), maxSalary ? parseFloat(maxSalary) : null)
      .input('isSalaryPublic', sql.Bit, isSalaryPublic ? 1 : 0)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE Vacancies SET
          JobTitle=@jobTitle, DepartmentId=@departmentId, EmploymentTypeId=@employmentTypeId,
          WorkspaceId=@workspaceId, LocationText=@location, JobSummary=@jobSummary,
          ExperienceLevelId=@experienceLevelId, MinSalary=@minSalary, MaxSalary=@maxSalary,
          IsSalaryPublic=@isSalaryPublic, status=@status, UpdatedAt=GETDATE()
        WHERE VacancyId=@id
      `);

    // 2. CHILD TABLES - DELETE THEN INSERT
    await new sql.Request(transaction).input('vId', sql.Int, vacancyId).query("DELETE FROM Vacancy_Responsibilities WHERE VacancyId=@vId");
    await new sql.Request(transaction).input('vId', sql.Int, vacancyId).query("DELETE FROM Vacancy_Skills WHERE VacancyId=@vId");
    await new sql.Request(transaction).input('vId', sql.Int, vacancyId).query("DELETE FROM Vacancy_Qualifications WHERE VacancyId=@vId");

    // Responsibilities
    if (responsibilities) {
      for (let i = 0; i < responsibilities.length; i++) {
        if (responsibilities[i].trim() !== "") {
          await new sql.Request(transaction)
            .input('vacancyId', sql.Int, vacancyId)
            .input('respText', sql.NVarChar, responsibilities[i])
            .input('sortOrder', sql.Int, i + 1)
            .query("INSERT INTO Vacancy_Responsibilities (VacancyId, ResponsibilityText, SortOrder) VALUES (@vacancyId, @respText, @sortOrder)");
        }
      }
    }

    // Skills
    if (skills) {
      for (let skillName of skills) {
        if (!skillName || skillName.trim() === "") continue;
        let existing = await pool.request().input('sName', sql.NVarChar, skillName).query("SELECT SkillId FROM Master_Skills WHERE SkillName=@sName");
        let skillId;
        if (existing.recordset.length > 0) {
          skillId = existing.recordset[0].SkillId;
        } else {
          let newSkill = await new sql.Request(transaction).input('sName2', sql.NVarChar, skillName).query("INSERT INTO Master_Skills (SkillName) OUTPUT INSERTED.SkillId VALUES (@sName2)");
          skillId = newSkill.recordset[0].SkillId;
        }
        await new sql.Request(transaction).input('vId', sql.Int, vacancyId).input('sId', sql.Int, skillId).query("INSERT INTO Vacancy_Skills (VacancyId, SkillId) VALUES (@vId, @sId)");
      }
    }

    // Qualifications
    if (qualifications) {
      for (let qualName of qualifications) {
        if (!qualName || qualName.trim() === "") continue;
        let existing = await pool.request().input('qName', sql.NVarChar, qualName).query("SELECT QualificationId FROM Master_Qualifications WHERE QualificationName=@qName");
        let qualId;
        if (existing.recordset.length > 0) {
          qualId = existing.recordset[0].QualificationId;
        } else {
          let newQual = await new sql.Request(transaction).input('qName2', sql.NVarChar, qualName).query("INSERT INTO Master_Qualifications (QualificationName) OUTPUT INSERTED.QualificationId VALUES (@qName2)");
          qualId = newQual.recordset[0].QualificationId;
        }
        await new sql.Request(transaction).input('vId2', sql.Int, vacancyId).input('qId', sql.Int, qualId).query("INSERT INTO Vacancy_Qualifications (VacancyId, QualificationId) VALUES (@vId2, @qId)");
      }
    }

    await transaction.commit();
    res.json({ message: "Vacancy updated successfully!" });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================================================================================================================
// ==================================================================================================================
//                                                  3. CANDIDATE API
// ==================================================================================================================
// ==================================================================================================================

// 3.1 Candidate API
// Purpose: Fetch Candidate Details
// Method: POST
app.use('/uploads', express.static('uploads'));
app.post('/api/candidates', upload.single('resume'), async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const data = req.body;

    // skills frontend se JSON string me aayega -> '["React.js","Tailwind"]'
    let skills = [];
    try { skills = JSON.parse(data.skills || '[]'); } catch (e) { skills = [] }

    const resumePath = req.file ? req.file.path : null;

    // 1. Candidate Insert
    const result = await pool.request()
      .input('first_name', sql.VarChar, data.first_name)
      .input('last_name', sql.VarChar, data.last_name)
      .input('email', sql.VarChar, data.email)
      .input('phone', sql.VarChar, data.phone)
      .input('current_location', sql.VarChar, data.current_location)
      .input('highest_qualification', sql.VarChar, data.highest_qualification)
      .input('applied_role', sql.VarChar, data.applied_role)
      .input('current_employer', sql.VarChar, data.current_employer)
      .input('experience_years', sql.Decimal(4, 1), data.experience_years || null)
      .input('current_ctc', sql.Int, data.current_ctc || null)
      .input('expected_ctc', sql.Int, data.expected_ctc || null)
      .input('notice_period', sql.VarChar, data.notice_period)
      .input('application_source', sql.VarChar, data.application_source)
      .input('linkedin_url', sql.VarChar, data.linkedin_url)
      .input('portfolio_url', sql.VarChar, data.portfolio_url)
      .input('resume_path', sql.VarChar, resumePath)
      .input('recruiter_notes', sql.VarChar, data.recruiter_notes)
      .query(`
                INSERT INTO candidates (first_name, last_name, email, phone, current_location, highest_qualification, applied_role, current_employer, experience_years, current_ctc, expected_ctc, notice_period, application_source, linkedin_url, portfolio_url, resume_path, recruiter_notes)
                OUTPUT INSERTED.id
                VALUES (@first_name, @last_name, @email, @phone, @current_location, @highest_qualification, @applied_role, @current_employer, @experience_years, @current_ctc, @expected_ctc, @notice_period, @application_source, @linkedin_url, @portfolio_url, @resume_path, @recruiter_notes)
            `);

    const candidateId = result.recordset[0].id;

    // 2. Skills Loop
    for (let name of skills) {
      name = name.trim();
      if (!name) continue;

      let check = await pool.request().input('skill_name', sql.VarChar, name)
        .query('SELECT id FROM skills WHERE skill_name = @skill_name');

      let skillId;
      if (check.recordset.length > 0) {
        skillId = check.recordset[0].id;
      } else {
        let newSkill = await pool.request().input('skill_name', sql.VarChar, name)
          .query('INSERT INTO skills (skill_name) OUTPUT INSERTED.id VALUES (@skill_name)');
        skillId = newSkill.recordset[0].id;
      }

      await pool.request()
        .input('candidate_id', sql.Int, candidateId)
        .input('skill_id', sql.Int, skillId)
        .query('IF NOT EXISTS (SELECT 1 FROM candidate_skills WHERE candidate_id=@candidate_id AND skill_id=@skill_id) INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (@candidate_id, @skill_id)');
    }
    // 3. 🔔 Notification Generate - isse main kaam fail nahi hoga
    try {
      await createNotification(
        "New Candidate Created",
        `${data.first_name} ${data.last_name} applied for ${data.applied_role}`,
        "candidate",
        candidateId
      );
    } catch (notifErr) {
      console.log("Notification fail but candidate saved:", notifErr.message);
    }
    res.status(201).json({ success: true, id: candidateId, message: 'Candidate added successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3.2 GET ALL CANDIDATES WITH PIPELINE STATUS - FIXED
// Purpose: When you are fetching candidates on candidate list page you have to show the pipeline status, therefore you need to fetch this.So this API fetch CANDIDATES + PIPELINE STATUS
// Mthod: GET 
app.get('/api/candidates', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
            SELECT 
                c.id, 
                c.first_name, 
                c.last_name, 
                c.email, 
                c.phone, 
                c.current_location, 
                c.applied_role, 
                c.current_employer,
                c.experience_years, 
                c.current_ctc, 
                c.expected_ctc,
                c.notice_period,
                c.application_source,
                c.resume_path,
                c.created_at,
                COALESCE(STRING_AGG(s.skill_name, ', '), '') as skills,
                -- Latest Pipeline Status - ek hi baar me
                latest.CurrentStage as currentStage,
                latest.ApplicationId as lastApplicationId,
                latest.VacancyId as lastVacancyId,
                latest.JobTitle as lastJobTitle,
                ISNULL(appCount.totalApplications, 0) as totalApplications
            FROM candidates c
            LEFT JOIN candidate_skills cs ON c.id = cs.candidate_id
            LEFT JOIN skills s ON cs.skill_id = s.id
            OUTER APPLY (
                SELECT TOP 1 va.CurrentStage, va.ApplicationId, va.VacancyId, v.JobTitle
                FROM Vacancy_Applications va
                JOIN Vacancies v ON v.VacancyId = va.VacancyId
                WHERE va.CandidateId = c.id
                ORDER BY va.AppliedAt DESC
            ) as latest
            OUTER APPLY (
                SELECT COUNT(*) as totalApplications
                FROM Vacancy_Applications va
                WHERE va.CandidateId = c.id
            ) as appCount
            GROUP BY 
                c.id, c.first_name, c.last_name, c.email, c.phone, 
                c.current_location, c.applied_role, c.current_employer,
                c.experience_years, c.current_ctc, c.expected_ctc,
                c.notice_period, c.application_source, c.resume_path, c.created_at,
                latest.CurrentStage, latest.ApplicationId, latest.VacancyId, latest.JobTitle,
                appCount.totalApplications
            ORDER BY c.id DESC
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error("CANDIDATES FETCH ERROR:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 3.3 BULK UPLOAD API - USING EXCEL
// Purpose: When your excel parsed the parsed data upload in bulk in database so at that time this api is called. 
// Method: POST /api/candidate/bulk
app.post('/api/candidates/bulk', async (req, res) => {
  const rows = req.body;
  console.log('Bulk data received:', rows.length);

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Empty excel' });
  }

  try {
    const pool = await sql.connect(dbConfig);
    let inserted = 0;
    let skipped = 0;
    const seenEmails = new Set(); // Check duplicates in excel

    for (const r of rows) {
      // Both format is supported - First Name + firstName
      const first_name = (r['First Name'] || r.firstName || '').toString().trim();
      const last_name = (r['Last Name'] || r.lastName || '').toString().trim();
      const email = (r['Email'] || r.email || '').toString().trim().toLowerCase();
      const phone = (r['Phone'] || r.phone || '').toString().trim();
      const city = (r['City'] || r.currentCity || '').toString().trim();
      const applied_role = (r['Applied Role'] || r.appliedRole || '').toString().trim();
      const current_employer = (r['Current Employer'] || r.currentCompany || '').toString().trim();
      const exp = r['Experience (Years)'] || r.experienceYears || null;
      const currCTC = r['Current CTC'] || r.currentSalary || null;
      const expCTC = r['Expected CTC'] || r.expectedSalary || null;
      const notice = (r['Notice Period'] || r.noticePeriod || '').toString().trim();
      const source = (r['Source'] || r.source || 'Excel Bulk Upload').toString().trim();

      let skillsRaw = r['Skills'] || r.skills || '';
      if (Array.isArray(skillsRaw)) skillsRaw = skillsRaw.join(',');

      if (!email || !first_name) { skipped++; continue; }
      if (seenEmails.has(email)) { skipped++; continue; } // Same emails in excel
      seenEmails.add(email);

      //Is data already available in DB?
      const dup = await pool.request().input('email', sql.VarChar, email)
        .query('SELECT id FROM candidates WHERE email = @email');
      if (dup.recordset.length > 0) { skipped++; continue; }

      const result = await pool.request()
        .input('first_name', sql.VarChar, first_name)
        .input('last_name', sql.VarChar, last_name)
        .input('email', sql.VarChar, email)
        .input('phone', sql.VarChar, phone)
        .input('current_location', sql.VarChar, city)
        .input('applied_role', sql.VarChar, applied_role)
        .input('current_employer', sql.VarChar, current_employer)
        .input('experience_years', sql.Decimal(4, 1), exp)
        .input('current_ctc', sql.Int, currCTC)
        .input('expected_ctc', sql.Int, expCTC)
        .input('notice_period', sql.VarChar, notice)
        .input('application_source', sql.VarChar, source)
        .query(`INSERT INTO candidates (first_name, last_name, email, phone, current_location, applied_role, current_employer, experience_years, current_ctc, expected_ctc, notice_period, application_source) OUTPUT INSERTED.id VALUES (@first_name, @last_name, @email, @phone, @current_location, @applied_role, @current_employer, @experience_years, @current_ctc, @expected_ctc, @notice_period, @application_source)`);

      const candidateId = result.recordset[0].id;
      inserted++;

      const skillsArr = skillsRaw.toString().split(',').map(s => s.trim()).filter(Boolean);
      for (let name of skillsArr) {
        let sc = await pool.request().input('skill_name', sql.VarChar, name).query('SELECT id FROM skills WHERE skill_name=@skill_name');
        let skillId = sc.recordset.length ? sc.recordset[0].id : (await pool.request().input('skill_name', sql.VarChar, name).query('INSERT INTO skills (skill_name) OUTPUT INSERTED.id VALUES (@skill_name)')).recordset[0].id;
        await pool.request().input('candidate_id', sql.Int, candidateId).input('skill_id', sql.Int, skillId).query('INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (@candidate_id, @skill_id)');
      }
    }

    console.log(`Inserted: ${inserted}, Skipped: ${skipped}`);
    res.json({ success: true, message: `${inserted} candidates imported successfully, ${skipped} skipped (duplicate email)` });

  } catch (err) {
    console.error('BULK ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});
// 3.4 BULK DELETE - SELECTED CANDIDATES 
// Purpose: When you select multiple candidates and want to delete them, then this api will called.
// Method: POST
app.post('/api/candidates/bulk-delete', async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ error: 'No candidates selected' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const idsString = ids.join(','); // "1,5,8"

    // 1. Delete from application
    await pool.request().query(`DELETE FROM Vacancy_Applications WHERE CandidateId IN (${idsString})`);
    // 2. We need to delete the skills links due to (foreign key)
    await pool.request().query(`DELETE FROM candidate_skills WHERE candidate_id IN (${idsString})`);
    // 3. Then candidate delete
    await pool.request().query(
      `DELETE FROM candidates WHERE id IN (${idsString})`
    );

    console.log(`Deleted candidates: ${idsString}`);
    res.json({ success: true, message: `${ids.length} candidates deleted successfully` });

  } catch (err) {
    console.error('BULK DELETE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3.5 GET SINGLE CANDIDATE BY ID
// Purpose: This api fetched single candidate details
// Method: GET /api/candidates/:id
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT c.*,
          (SELECT STRING_AGG(s.skill_name, ', ')
           FROM candidate_skills cs
           JOIN skills s ON cs.skill_id = s.id
           WHERE cs.candidate_id = c.id
          ) as skills
        FROM candidates c
        WHERE c.id = @id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3.6 UPDATE CANDIDATE 
// Purpose: This api called when you need to update candidate details
// Method: PUT /api/candidates/:id
app.put('/api/candidates/:id', upload.single('resume'), async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const data = req.body;
    const id = req.params.id;

    await pool.request()
      .input('id', sql.Int, id)
      .input('first_name', sql.VarChar, data.first_name)
      .input('last_name', sql.VarChar, data.last_name)
      .input('email', sql.VarChar, data.email)
      .input('phone', sql.VarChar, data.phone)
      .input('current_location', sql.VarChar, data.current_location)
      .input('applied_role', sql.VarChar, data.applied_role)
      .input('current_employer', sql.VarChar, data.current_employer)
      .input('experience_years', sql.Decimal(4, 1), data.experience_years || null)
      .input('current_ctc', sql.Int, data.current_ctc || null)
      .input('expected_ctc', sql.Int, data.expected_ctc || null)
      .input('notice_period', sql.VarChar, data.notice_period)
      .query(`UPDATE candidates SET first_name=@first_name, last_name=@last_name, email=@email, phone=@phone, current_location=@current_location, applied_role=@applied_role, current_employer=@current_employer, experience_years=@experience_years, current_ctc=@current_ctc, expected_ctc=@expected_ctc, notice_period=@notice_period WHERE id=@id`);

    res.json({ success: true, message: 'Candidate updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.7 DELETE SINGLE CANDIDATE 
// Purpose: This api used when you need to delete single candidate
// Method: DELETE 
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const id = req.params.id;

    // Important: delete from child tables first
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM Vacancy_Applications WHERE CandidateId = @id`);
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM candidate_skills WHERE candidate_id = @id`);
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM candidates WHERE id = @id`);

    res.json({ success: true, message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================================================================================================
// =========================================================================================================================================================
//                                                                  4. APPLICATIONS
// =========================================================================================================================================================
// =========================================================================================================================================================

//  4.1 ADD CANDIDATES IN APPLICATIONS
// Purpose: You have candidates, now you want to create these candidates into applications then this api will called.
// Method: POST
app.post('/api/vacancies/:id/add-candidates', async (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id);
    const { candidateIds } = req.body;
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: "candidateIds array required" });
    }
    const pool = await getPool();
    let added = 0;
    for (const cid of candidateIds) {
      const result = await pool.request()
        .input('VacancyId', sql.Int, vacancyId)
        .input('CandidateId', sql.Int, parseInt(cid))
        .query(`
         IF NOT EXISTS(SELECT 1 FROM Vacancy_Applications WHERE VacancyId=@VacancyId AND CandidateId=@CandidateId)
         BEGIN
           DECLARE @NewId INT;
           INSERT INTO Vacancy_Applications(VacancyId, CandidateId, CurrentStage) VALUES(@VacancyId, @CandidateId, 'Screening');
           SET @NewId = SCOPE_IDENTITY();
           INSERT INTO Application_Stage_History(ApplicationId, FromStage, ToStage, Notes) VALUES(@NewId, NULL, 'Screening', 'Bulk added');
           SELECT 1 as inserted;
         END
         ELSE BEGIN SELECT 0 as inserted; END
       `);
      if (result.recordset && result.recordset[0]?.inserted === 1) added++;
    }
    res.json({ message: `${added} applications created for Job ${vacancyId}`, added });
  } catch (err) {
    console.error("ADD-CANDIDATES FAILED:", err);
    res.status(500).json({ error: err.message });
  }
});
//  4.2 APPLICATIONS SUMMARY
// Purpose: This API gives you applications summary
// Method: GET
app.get('/api/applications/summary', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        v.VacancyId as id,
        v.JobTitle as jobTitle,
        COALESCE(d.DepartmentName, 'N/A') as department,
        COALESCE(v.LocationText, l.City, 'N/A') as location,
        COUNT(va.ApplicationId) as totalCandidates,
        ISNULL(SUM(CASE WHEN va.CurrentStage='Screening' THEN 1 ELSE 0 END),0) as screening,
        ISNULL(SUM(CASE WHEN va.CurrentStage='Interview' THEN 1 ELSE 0 END),0) as interview,
        ISNULL(SUM(CASE WHEN va.CurrentStage='Offer' THEN 1 ELSE 0 END),0) as offer,
        ISNULL(SUM(CASE WHEN va.CurrentStage='Hired' THEN 1 ELSE 0 END),0) as hired,
        MAX(va.AppliedAt) as lastAppliedAt
      FROM Vacancies v
      LEFT JOIN Vacancy_Applications va ON va.VacancyId = v.VacancyId
      LEFT JOIN Master_Departments d ON d.DepartmentId = v.DepartmentId
      LEFT JOIN Master_Locations l ON l.LocationId = v.LocationId
      GROUP BY v.VacancyId, v.JobTitle, d.DepartmentName, v.LocationText, l.City
      ORDER BY MAX(va.AppliedAt) DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SUMMARY QUERY FAILED:", err);
    res.status(500).json({ error: err.message });
  }
});
//  4.3 APPLICATIONS IN VACANCY
// Purpose: You have no of vacancies and you added no of candidates in an individual vacancy. now if you want to get how many candidates available in a particular vacancy then this api will called.
// Method: GET /api/vacancies/:id/applications
app.get('/api/vacancies/:id/applications', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('VacancyId', sql.Int, req.params.id)
      .query(`
        SELECT va.ApplicationId, va.CurrentStage, va.AppliedAt, va.UpdatedAt,
               c.id as candidateId, c.first_name, c.last_name, c.email,
               CONCAT(c.first_name, ' ', c.last_name) as CandidateName
        FROM Vacancy_Applications va
        JOIN candidates c ON c.id = va.CandidateId
        WHERE va.VacancyId = @VacancyId
        ORDER BY va.AppliedAt DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.4 MOVE CANDIDATES IN HIRING PIPELINE
// Purpose: Used to move candidates in hiring pipeline. Updates candidate stage
// Method: PUT /api/applications/:id/move
app.put('/api/applications/:id/move', async (req, res) => {
  try {
    const { toStage, notes } = req.body; // toStage = 'Interview', 'Hired' etc
    const pool = await getPool();

    const result = await pool.request()
      .input('AppId', sql.Int, req.params.id)
      .input('ToStage', sql.NVarChar, toStage)
      .input('Notes', sql.NVarChar, notes || `Moved to ${toStage}`)
      .query(`
        DECLARE @from NVARCHAR(50);
        SELECT @from = CurrentStage FROM Vacancy_Applications WHERE ApplicationId = @AppId;
        
        UPDATE Vacancy_Applications SET CurrentStage = @ToStage WHERE ApplicationId = @AppId;
        
        INSERT INTO Application_Stage_History (ApplicationId, FromStage, ToStage, Notes)
        VALUES (@AppId, @from, @ToStage, @Notes);
        
        SELECT @from as fromStage, @ToStage as toStage;
      `);

    res.json({ message: `Moved from ${result.recordset[0].fromStage} to ${result.recordset[0].toStage}` });
  } catch (err) {
    console.error("MOVE FAILED:", err);
    // If user give any invlaid stage then this error will occur.
    if (err.message.includes('CK_VA_Stage')) {
      return res.status(400).json({ error: `Invalid stage. Use: Applied, Screening, Shortlisted, Interview, Assessment, Offer, Hired, Rejected, On Hold` });
    }
    res.status(500).json({ error: err.message });
  }
});

// 4.5 APPLICATION HISTORY
// Purpose: 
// Method: GET
app.get('/api/applications/:id/history', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('AppId', sql.Int, req.params.id)
    .query(`SELECT * FROM Application_Stage_History WHERE ApplicationId=@AppId ORDER BY ChangedAt DESC`);
  res.json(result.recordset);
});

// DELETE single application
app.delete('/api/vacancies/:vacancyId/applications/:candidateId', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('VacancyId', sql.Int, req.params.vacancyId)
      .input('CandidateId', sql.Int, req.params.candidateId)
      .query('DELETE FROM Vacancy_Applications WHERE VacancyId=@VacancyId AND CandidateId=@CandidateId');

    res.json({ success: true, message: "Application deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ALL - pura process reset karne ke liye (testing ke liye)
app.delete('/api/vacancies/:id/applications', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('VacancyId', sql.Int, req.params.id)
      .query('DELETE FROM Vacancy_Applications WHERE VacancyId=@VacancyId');
    res.json({ success: true, message: "All applications cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ====================================================================================================================================================
// ====================================================================================================================================================
//                                                                    5. DASHBOARD API
//=====================================================================================================================================================
//=====================================================================================================================================================

// 5.1 DASHBOARD API
// Purpose: This API gives requires stats & information about whats happening in databse.
// Method: GET
// 5.1 DASHBOARD API - ENHANCED FOR ANALYTICS
// 5.1 DASHBOARD API - FINAL FIXED VERSION FOR YOUR SCHEMA
app.get('/api/dashboard', async (req, res) => {
  try {
    const pool = await getPool();

    const safeQuery = async (sqlText) => {
      try {
        const r = await pool.request().query(sqlText);
        return r;
      } catch (e) {
        console.warn("Dashboard sub-query skipped:", e.message.split('\n')[0]);
        return { recordset: [] };
      }
    };

    // Core queries - ye tumhare schema pe 100% chalengi
    const counts = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Vacancies) as totalVacancies,
        (SELECT COUNT(*) FROM Vacancies WHERE Status IN ('Active','Published')) as openJobs,
        (SELECT COUNT(*) FROM Vacancies WHERE Status IN ('Closed','Filled')) as closedJobs,
        (SELECT COUNT(*) FROM Vacancies WHERE Status = 'Draft') as draftJobs,
        (SELECT COUNT(*) FROM candidates) as totalCandidates,
        (SELECT COUNT(*) FROM Vacancy_Applications) as totalApplications,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Interview') as interviews,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Hired') as hired,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Screening') as screening,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Offer') as offers,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Rejected') as rejected,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE AppliedAt >= DATEADD(day, -30, GETDATE())) as applicationsLast30Days,
        (SELECT COUNT(*) FROM Vacancies WHERE CreatedAt >= DATEADD(day, -30, GETDATE())) as jobsLast30Days,
        (SELECT ISNULL(AVG(CAST(c as FLOAT)),0) FROM (SELECT COUNT(*) as c FROM Vacancy_Applications GROUP BY VacancyId) t) as avgApplicantsPerJob
    `);

    const pipelineResult = await pool.request().query(`SELECT CurrentStage as stage, COUNT(*) as count FROM Vacancy_Applications GROUP BY CurrentStage`);
    const deptResult = await pool.request().query(`SELECT COALESCE(d.DepartmentName, 'N/A') as name, COUNT(v.VacancyId) as value FROM Vacancies v LEFT JOIN Master_Departments d ON d.DepartmentId = v.DepartmentId GROUP BY d.DepartmentName`);
    const recentVac = await pool.request().query(`SELECT TOP 5 v.VacancyId as id, v.JobTitle as title, v.Status as status, COALESCE(d.DepartmentName,'N/A') as department, DATEDIFF(day, v.CreatedAt, GETDATE()) as daysOpen, (SELECT COUNT(*) FROM Vacancy_Applications va WHERE va.VacancyId = v.VacancyId) as applicants FROM Vacancies v LEFT JOIN Master_Departments d ON d.DepartmentId = v.DepartmentId ORDER BY v.CreatedAt DESC`);
    const recentApp = await pool.request().query(`SELECT TOP 8 va.ApplicationId as id, c.first_name + ' ' + ISNULL(c.last_name,'') as candidateName, v.JobTitle as jobTitle, va.CurrentStage as stage, va.AppliedAt as appliedAt, c.id as candidateId, v.VacancyId FROM Vacancy_Applications va JOIN candidates c ON c.id = va.CandidateId JOIN Vacancies v ON v.VacancyId = va.VacancyId ORDER BY va.AppliedAt DESC`);
    const monthlyTrend = await pool.request().query(`
      SELECT FORMAT(DATEADD(month, -n, GETDATE()), 'MMM yy') as month, YEAR(DATEADD(month, -n, GETDATE())) as year, MONTH(DATEADD(month, -n, GETDATE())) as monthNum,
      (SELECT COUNT(*) FROM Vacancies WHERE YEAR(CreatedAt)=YEAR(DATEADD(month, -n, GETDATE())) AND MONTH(CreatedAt)=MONTH(DATEADD(month, -n, GETDATE()))) as jobs,
      (SELECT COUNT(*) FROM Vacancy_Applications WHERE YEAR(AppliedAt)=YEAR(DATEADD(month, -n, GETDATE())) AND MONTH(AppliedAt)=MONTH(DATEADD(month, -n, GETDATE()))) as applications,
      (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage='Hired' AND YEAR(UpdatedAt)=YEAR(DATEADD(month, -n, GETDATE())) AND MONTH(UpdatedAt)=MONTH(DATEADD(month, -n, GETDATE()))) as hires
      FROM (VALUES (11),(10),(9),(8),(7),(6),(5),(4),(3),(2),(1),(0)) as T(n) ORDER BY year, monthNum
    `);
    const statusDist = await pool.request().query(`SELECT Status as name, COUNT(*) as value FROM Vacancies GROUP BY Status`);
    const topJobs = await pool.request().query(`SELECT TOP 5 v.JobTitle as title, COUNT(va.ApplicationId) as applicants, v.Status as status FROM Vacancies v LEFT JOIN Vacancy_Applications va ON va.VacancyId = v.VacancyId GROUP BY v.VacancyId, v.JobTitle, v.Status ORDER BY applicants DESC`);
    const staleJobs = await pool.request().query(`SELECT TOP 5 v.VacancyId as id, v.JobTitle as title, DATEDIFF(day, v.CreatedAt, GETDATE()) as daysOpen, (SELECT COUNT(*) FROM Vacancy_Applications WHERE VacancyId = v.VacancyId) as applicants FROM Vacancies v WHERE v.Status IN ('Active','Published') ORDER BY applicants ASC, v.CreatedAt ASC`);
    const aging = await pool.request().query(`SELECT ISNULL(AVG(CAST(DATEDIFF(day, v.CreatedAt, GETDATE()) as FLOAT)),0) as avgDaysOpen, ISNULL(AVG(CAST(DATEDIFF(day, va.AppliedAt, va.UpdatedAt) as FLOAT)),0) as avgTimeToHire FROM Vacancies v LEFT JOIN Vacancy_Applications va ON va.VacancyId = v.VacancyId AND va.CurrentStage='Hired'`);

    // Safe / Optional queries - agar column nahi hai toh fail nahi hongi
    const sourceWise = await safeQuery(`SELECT TOP 6 COALESCE(application_source, 'Direct') as name, COUNT(*) as value FROM candidates GROUP BY application_source ORDER BY value DESC`);
    const locationWise = await safeQuery(`SELECT TOP 8 COALESCE(LocationText, 'N/A') as name, COUNT(*) as value FROM Vacancies GROUP BY LocationText ORDER BY value DESC`);
    const experienceStats = await safeQuery(`
      SELECT
        CASE
          WHEN ISNULL(experience_years,0) < 2 THEN '0-2 Years'
          WHEN experience_years < 5 THEN '2-5 Years'
          WHEN experience_years < 10 THEN '5-10 Years'
          ELSE '10+ Years'
        END as name, COUNT(*) as value
      FROM candidates GROUP BY
        CASE
          WHEN ISNULL(experience_years,0) < 2 THEN '0-2 Years'
          WHEN experience_years < 5 THEN '2-5 Years'
          WHEN experience_years < 10 THEN '5-10 Years'
          ELSE '10+ Years'
        END
    `);
    const ctcStats = await safeQuery(`SELECT 'Current CTC' as type, AVG(CAST(current_ctc as FLOAT)) as avgValue FROM candidates WHERE current_ctc IS NOT NULL UNION ALL SELECT 'Expected CTC', AVG(CAST(expected_ctc as FLOAT)) FROM candidates WHERE expected_ctc IS NOT NULL`);

    const c = counts.recordset[0];
    const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On Hold'];
    const pipelineMap = {};
    pipelineResult.recordset.forEach(r => pipelineMap[r.stage] = r.count);
    const pipeline = STAGES.map(s => ({ stage: s, count: pipelineMap[s] || 0 }));
    const totalApplied = pipeline.reduce((a, b) => a + b.count, 0) || 1;
    const funnel = pipeline.map(p => ({ ...p, percent: Math.round((p.count / totalApplied) * 100) }));

    res.json({
      stats: {
        openJobs: c.openJobs, totalVacancies: c.totalVacancies, closedJobs: c.closedJobs, draftJobs: c.draftJobs,
        totalCandidates: c.totalCandidates, totalApplications: c.totalApplications,
        interviews: c.interviews, hired: c.hired, screening: c.screening, offers: c.offers, rejected: c.rejected,
        applicationsLast30Days: c.applicationsLast30Days, jobsLast30Days: c.jobsLast30Days,
        avgApplicantsPerJob: Number((c.avgApplicantsPerJob || 0).toFixed(1)),
        avgDaysOpen: Math.round(aging.recordset[0]?.avgDaysOpen || 0),
        avgTimeToHire: Math.round(aging.recordset[0]?.avgTimeToHire || 0),
      },
      pipeline, funnel,
      departmentWise: deptResult.recordset,
      statusDistribution: statusDist.recordset,
      sourceWise: sourceWise.recordset.length ? sourceWise.recordset : [{ name: 'Direct', value: c.totalCandidates }],
      locationWise: locationWise.recordset,
      experienceStats: experienceStats.recordset,
      ctcStats: ctcStats.recordset,
      monthlyTrend: monthlyTrend.recordset,
      topJobs: topJobs.recordset,
      staleJobs: staleJobs.recordset,
      recentVacancies: recentVac.recordset,
      recentApplications: recentApp.recordset,
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
// ==========================================================================================================
// ==========================================================================================================
//                         6. GLOBAL SEARCH API - Vacancies + Candidates + Applications
//===========================================================================================================
//===========================================================================================================

// 6.1 GLOBAL SEARCH API
// Purpose: You have a global search this api used to scan whole databse as globally.
// Method: GET
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  try {
    const pool = await getPool();
    const like = `%${q}%`;

    // 1. Vacancies search
    const vacResult = await pool.request()
      .input('q', sql.NVarChar, like)
      .query(`
        SELECT TOP 10
          'vacancy' as type,
          CAST(v.VacancyId as NVARCHAR) as id,
          v.JobTitle as title,
          CONCAT(COALESCE(d.DepartmentName,'N/A'), ' • ', COALESCE(v.LocationText,'N/A'), ' • ', v.Status) as subtitle,
          v.Status as status,
          v.VacancyId as navId
        FROM Vacancies v
        LEFT JOIN Master_Departments d ON d.DepartmentId = v.DepartmentId
        WHERE v.JobTitle LIKE @q
           OR v.JobSummary LIKE @q
           OR v.LocationText LIKE @q
           OR CAST(v.VacancyId as NVARCHAR) LIKE @q
        ORDER BY v.CreatedAt DESC
      `);

    // 2. Candidates search
    const candResult = await pool.request()
      .input('q', sql.NVarChar, like)
      .query(`
        SELECT TOP 10
          'candidate' as type,
          CAST(c.id as NVARCHAR) as id,
          c.first_name + ' ' + c.last_name as title,
          CONCAT(c.email, ' • ', c.applied_role, ' • ', c.current_location) as subtitle,
          c.applied_role as status,
          c.id as navId
        FROM candidates c
        WHERE c.first_name LIKE @q
           OR c.last_name LIKE @q
           OR c.email LIKE @q
           OR c.phone LIKE @q
           OR c.applied_role LIKE @q
           OR c.current_location LIKE @q
        ORDER BY c.created_at DESC
      `);

    // 3. Applications search (Pipeline)
    const appResult = await pool.request()
      .input('q', sql.NVarChar, like)
      .query(`
        SELECT TOP 10
          'application' as type,
          CAST(va.ApplicationId as NVARCHAR) as id,
          c.first_name + ' ' + c.last_name + ' → ' + v.JobTitle as title,
          CONCAT('Stage: ', va.CurrentStage, ' • Job #', v.VacancyId) as subtitle,
          va.CurrentStage as status,
          va.VacancyId as navId
        FROM Vacancy_Applications va
        JOIN candidates c ON c.id = va.CandidateId
        JOIN Vacancies v ON v.VacancyId = va.VacancyId
        WHERE c.first_name LIKE @q
           OR c.last_name LIKE @q
           OR v.JobTitle LIKE @q
           OR va.CurrentStage LIKE @q
        ORDER BY va.AppliedAt DESC
      `);

    const all = [...vacResult.recordset, ...candResult.recordset, ...appResult.recordset];
    res.json(all);

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================================================================================
// ========================================================================================================
//                                            7. API Interviews - FINAL FIXED 
// ========================================================================================================
// ========================================================================================================

// 7.1 DELETE API 
// Purpose: This API Used to delete your created interviews
// Method: DELETE
app.delete('/api/interviews/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('Id', sql.Int, req.params.id)
      .query(`DELETE FROM Interviews WHERE InterviewId = @Id`);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
// 7.2 RESCHEDULE API 
// Purpose: This API Used to reschedule your created interviews
// Method: PUT /api/interviews/:id - Reschedule
app.put('/api/interviews/:id', async (req, res) => {
  const { InterviewDate, InterviewTime, Duration, Venue, Mode, MeetingLink, Interviewer, Notes } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('Id', sql.Int, req.params.id)
      .input('Date', sql.Date, InterviewDate)
      .input('Time', sql.Time, InterviewTime)
      .input('Duration', sql.Int, parseInt(Duration))
      .input('Venue', sql.NVarChar, Venue)
      .input('Mode', sql.NVarChar, Mode)
      .input('Notes', sql.NVarChar, Notes)
      .input('Link', sql.NVarChar, MeetingLink)
      .input('Interviewer', sql.NVarChar, Interviewer)
      .query(`UPDATE Interviews SET InterviewDate=@Date, InterviewTime=@Time, Duration=@Duration, Venue=@Venue, Mode=@Mode, MeetingLink=@Link, Interviewer=@Interviewer, UpdatedAt=GETDATE() WHERE InterviewId=@Id`);
    res.json({ message: "Rescheduled" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7.3 GET SCHEDULED INTERVIEWS
// Purpose: This API Used to fetch scheduled interviews
// Method: GET
app.get('/api/interviews', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        i.InterviewId, 
        i.ApplicationId, 
        i.VacancyId, 
        i.InterviewDate, 
        i.InterviewTime,
        i.Notes,
        i.Duration, i.InterviewType, i.Round, i.Mode, 
        i.Venue, i.Platform, i.MeetingLink, i.Interviewer, i.Status,
        -- Candidate
        CONCAT(c.first_name, ' ', c.last_name) as CandidateName,
        c.email as CandidateEmail,
        -- Vacancy with normalized location
        v.JobTitle,
        COALESCE(v.LocationText, CONCAT(ml.City, ', ', ml.State)) as Location,
        ml.City as VacancyCity
      FROM Interviews i
      JOIN Vacancy_Applications va ON va.ApplicationId = i.ApplicationId
      JOIN candidates c ON c.id = va.CandidateId
      JOIN Vacancies v ON v.VacancyId = i.VacancyId
      LEFT JOIN Master_Locations ml ON v.LocationId = ml.LocationId
      ORDER BY i.InterviewDate DESC, i.InterviewTime DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET /api/interviews error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7.4 POST SCHEDULED INTERVIEWS
// Purpose: This API Used to POST INSERT  scheduled interviews in DATABASE
// Method: POST
app.post('/api/interviews', async (req, res) => {
  let { ApplicationId, VacancyId, date, time, duration = 60, mode, venue, platform, meetingLink, InterviewDate, InterviewTime, interviewType, round, interviewer, notes, building, floorRoom, meetingId, passcode } = req.body;

  const finalDate = InterviewDate || date;
  const finalTime = InterviewTime || time;

  ApplicationId = parseInt(ApplicationId);
  VacancyId = parseInt(VacancyId);
  duration = parseInt(duration);

  if (!ApplicationId || !VacancyId || !finalDate || !finalTime || !mode) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();


    // VALIDATION: Simple exact time check (overlap based query failed at TIME cast) ---
    const conflictCheck = await new sql.Request(transaction)
      .input('ApplicationId', sql.Int, ApplicationId)
      .input('InterviewDate', sql.Date, finalDate)
      .input('InterviewTime', sql.Time, finalTime)
      .input('Interviewer', sql.NVarChar, interviewer || null)
      .query(`
        SELECT TOP 1 'Candidate already has an interview at this time' as reason
        FROM Interviews
        WHERE ApplicationId = @ApplicationId
        AND InterviewDate = @InterviewDate
        AND InterviewTime = @InterviewTime
        AND Status = 'Scheduled'

        UNION

        SELECT TOP 1 'Interviewer is already busy at this time' as reason
        FROM Interviews
        WHERE Interviewer = @Interviewer
        AND @Interviewer IS NOT NULL AND @Interviewer!= ''
        AND InterviewDate = @InterviewDate
        AND InterviewTime = @InterviewTime
        AND Status = 'Scheduled'
      `);

    if (conflictCheck.recordset.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        error: "Slot already booked",
        reason: conflictCheck.recordset[0].reason
      });
    }

    // ********  INSERT  **********************
    const request = new sql.Request(transaction);
    const interviewResult = await request
      .input('ApplicationId', sql.Int, ApplicationId)
      .input('VacancyId', sql.Int, VacancyId)
      .input('InterviewDate', sql.Date, finalDate)
      .input('InterviewTime', sql.Time, finalTime)
      .input('Duration', sql.Int, duration)
      .input('InterviewType', sql.NVarChar, interviewType || 'Technical')
      .input('Round', sql.NVarChar, round || 'Round 1')
      .input('Mode', sql.NVarChar, mode)
      .input('Venue', sql.NVarChar, venue || (mode === 'Onsite' ? 'Dera Bassi Office' : null))
      .input('Building', sql.NVarChar, building || null)
      .input('FloorRoom', sql.NVarChar, floorRoom || null)
      .input('Platform', sql.NVarChar, platform || null)
      .input('MeetingLink', sql.NVarChar, meetingLink || null)
      .input('MeetingId', sql.NVarChar, meetingId || null)
      .input('Passcode', sql.NVarChar, passcode || null)
      .input('Interviewer', sql.NVarChar, interviewer || null)
      .input('Notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Interviews (ApplicationId, VacancyId, InterviewDate, InterviewTime, Duration, InterviewType, Round, Mode, Venue, Building, FloorRoom, Platform, MeetingLink, MeetingId, Passcode, Interviewer, Notes, Status)
        VALUES (@ApplicationId, @VacancyId, @InterviewDate, @InterviewTime, @Duration, @InterviewType, @Round, @Mode, @Venue, @Building, @FloorRoom, @Platform, @MeetingLink, @MeetingId, @Passcode, @Interviewer, @Notes, 'Scheduled');
        SELECT SCOPE_IDENTITY() as InterviewId;
      `);

    // Stage history bhi update karo
    await new sql.Request(transaction)
      .input('AppId', sql.Int, ApplicationId)
      .query(`
        DECLARE @FromStage NVARCHAR(50);
        SELECT @FromStage = CurrentStage FROM Vacancy_Applications WHERE ApplicationId = @AppId;
        UPDATE Vacancy_Applications SET CurrentStage = 'Interview', UpdatedAt = GETDATE() WHERE ApplicationId = @AppId;
        INSERT INTO Application_Stage_History (ApplicationId, FromStage, ToStage, Notes) VALUES (@AppId, @FromStage, 'Interview', 'Interview Scheduled');
    `);

    await transaction.commit();
    res.status(201).json({ message: "Interview scheduled", InterviewId: interviewResult.recordset[0].InterviewId });

  } catch (err) {
    try { await transaction.rollback(); } catch (e) { }
    console.error("POST /api/interviews error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * =================================================================
 * API: GET /api/vacancies/:id/interview-applications
 * METHOD: GET
 * EXAMPLE: GET /api/vacancies/1004/interview-applications
 * PURPOSE: For Interviews Page Pipeline
 * - Returns only candidates who are in 'Interview' stage
 * - AND whose interview is NOT yet scheduled
 * - Used to prevent double-booking / duplicate scheduling
 * =================================================================
 */
app.get('/api/vacancies/:id/interview-applications', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input('VacancyId', sql.Int, req.params.id).query(`
      SELECT va.ApplicationId, va.CurrentStage, c.id as candidateId, c.first_name, c.last_name, c.email,
             CONCAT(c.first_name, ' ', c.last_name) as CandidateName
      FROM Vacancy_Applications va JOIN candidates c ON c.id = va.CandidateId
      LEFT JOIN Interviews i ON i.ApplicationId = va.ApplicationId AND i.Status='Scheduled'
      WHERE va.VacancyId=@VacancyId AND va.CurrentStage='Interview' AND i.InterviewId IS NULL
      ORDER BY va.AppliedAt DESC
    `);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }) }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📦 Connected to recru on U3IT2\\BCDEMO`);
});
