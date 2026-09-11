//  requirements
const express = require('express');
const cors = require('cors')
const sql = require('mssql/msnodesqlv8');
const { NVarChar } = require('msnodesqlv8');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();
console.log("EMAIL_USER loaded:", process.env.EMAIL_USER ? "yes" : "NO - .env missing");

//************************************************************
// ------------------- */ Resume upload setup
// ***********************************************************
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });



const app = express();
app.use(cors())
app.use(express.json());

const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=U3IT2\\BCDEMO;Database=recru;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;',
};

async function getPool() {
  return await sql.connect(dbConfig);
}

/* ************************************************** 
-------------------- VACANCY API CODING START
***************************************************** */
// 1. --------------------------------GET ALL MASTER DATA------------------------------------------------
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

// 2. ---------------------CREATE VACANCY---------------------------------------------------------------------
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

    // --- SALARY VALIDATION FIX ---
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
    const finalStatus = allowedStatus.includes(status)? status: 'Active';

    let vacancyResult = await new sql.Request(transaction)
      .input('jobTitle', sql.NVarChar, jobTitle)
      .input('departmentId', sql.Int, departmentId)
      .input('employmentTypeId', sql.Int, employmentTypeId)
      .input('workspaceId', sql.Int, workspaceId)
      .input('location', sql.NVarChar, location)
      .input('jobSummary', sql.NVarChar, jobSummary)
      .input('experienceLevelId', sql.Int, experienceLevelId)
      .input('minSalary', sql.Decimal(12,2), minVal)
      .input('maxSalary', sql.Decimal(12,2), maxVal)
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

// 3. ---------------------------------------GET ALL VACANCIES - FIXED ALIASES FOR FRONTEND-------------------------------------------------------
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

// 4. ----------------------------------------------GET SINGLE VACANCY WITH DETAILS----------------------------------------------------------------
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

app.delete('/api/vacancies/:id', async (req, res) => {
  try {
    let pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id).query("DELETE FROM Vacancies WHERE VacancyId=@id");
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. -------------------------------------------UPDATE VACANCY-----------------------------------------------------------------------------------------------------------
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
     .input('minSalary', sql.Decimal(12,2), minSalary? parseFloat(minSalary) : null)
     .input('maxSalary', sql.Decimal(12,2), maxSalary? parseFloat(maxSalary) : null)
     .input('isSalaryPublic', sql.Bit, isSalaryPublic? 1 : 0)
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
        if (responsibilities[i].trim()!== "") {
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

// ************************************************** 
//                VACANCY API CLOSED 
//***************************************************


// **************************************************************************
// **************************************************************************
//                       CANDIDATE API
// **************************************************************************
// **************************************************************************

// --- CREATE CANDIDATE API ---
app.use('/uploads', express.static('uploads'));
app.post('/api/candidates', upload.single('resume'), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const data = req.body;

        // skills frontend se JSON string me aayega -> '["React.js","Tailwind"]'
        let skills = [];
        try { skills = JSON.parse(data.skills || '[]'); } catch(e) { skills = [] }

        const resumePath = req.file? req.file.path : null;

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
          .input('experience_years', sql.Decimal(4,1), data.experience_years || null)
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
            if(!name) continue;

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

        res.status(201).json({ success: true, id: candidateId, message: 'Candidate added successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- GET ALL CANDIDATES WITH PIPELINE STATUS - FIXED ---
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

// **********************************************************************************************
// ******************************** --- BULK UPLOAD API - USING EXCEL ---***************************
// **********************************************************************************************
// --- BULK UPLOAD API - FINAL FIXED ---
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
        const seenEmails = new Set(); // Excel ke andar hi duplicate check

        for (const r of rows) {
            // Dono format support - First Name + firstName
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

            if (!email ||!first_name) { skipped++; continue; }
            if (seenEmails.has(email)) { skipped++; continue; } // Excel me hi same email 2 baar
            seenEmails.add(email);

            // DB me already hai kya?
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
              .input('experience_years', sql.Decimal(4,1), exp)
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
                let skillId = sc.recordset.length? sc.recordset[0].id : (await pool.request().input('skill_name', sql.VarChar, name).query('INSERT INTO skills (skill_name) OUTPUT INSERTED.id VALUES (@skill_name)')).recordset[0].id;
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
// --------------------------------- Delete Multiple Selected Candidate ------------------------------
// ================= BULK DELETE - SELECTED CANDIDATES =================
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

// ================= GET SINGLE CANDIDATE BY ID =================
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
    if(result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= UPDATE CANDIDATE =================
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
     .input('experience_years', sql.Decimal(4,1), data.experience_years || null)
     .input('current_ctc', sql.Int, data.current_ctc || null)
     .input('expected_ctc', sql.Int, data.expected_ctc || null)
     .input('notice_period', sql.VarChar, data.notice_period)
     .query(`UPDATE candidates SET first_name=@first_name, last_name=@last_name, email=@email, phone=@phone, current_location=@current_location, applied_role=@applied_role, current_employer=@current_employer, experience_years=@experience_years, current_ctc=@current_ctc, expected_ctc=@expected_ctc, notice_period=@notice_period WHERE id=@id`);

    res.json({ success: true, message: 'Candidate updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE SINGLE CANDIDATE =================
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
// **************************************************************************
// **************************************************************************
//                       CANDIDATE API CLOSED
// **************************************************************************
// **************************************************************************


// Add Candidates & Jobs in Application - DEBUGGED

app.post('/api/vacancies/:id/add-candidates', async (req,res)=>{
  try {
    const vacancyId = parseInt(req.params.id);
    const { candidateIds } = req.body; // [101,102,103]

    if(!candidateIds ||!Array.isArray(candidateIds) || candidateIds.length === 0){
      return res.status(400).json({ error: "candidateIds array required" });
    }

    const pool = await sql.connect();
    let added = 0;

    for(const cid of candidateIds){
      const result = await pool.request()
      .input('VacancyId', sql.Int, vacancyId)
      .input('CandidateId', sql.Int, parseInt(cid))
      .query(`
         IF NOT EXISTS(SELECT 1 FROM Vacancy_Applications WHERE VacancyId=@VacancyId AND CandidateId=@CandidateId)
         BEGIN
           INSERT INTO Vacancy_Applications(VacancyId, CandidateId, CurrentStage) VALUES(@VacancyId, @CandidateId, 'Screening');
           INSERT INTO Application_Stage_History(ApplicationId, FromStage, ToStage, Notes) VALUES(SCOPE_IDENTITY(), NULL, 'Screening', 'Bulk added');
           SELECT 1 as inserted;
         END
         ELSE
         BEGIN
           SELECT 0 as inserted;
         END
       `);
      // result.recordset[0].inserted will be 1 if added
      if(result.recordset && result.recordset[0]?.inserted === 1) added++;
    }
    res.json({message: `${added} applications created for Job ${vacancyId}`, added});
  } catch(err){
    console.error("ADD-CANDIDATES FAILED:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/applications/summary', async (req, res) => {
  try {
    const pool = await sql.connect();
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
      INNER JOIN Vacancy_Applications va ON va.VacancyId = v.VacancyId
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

app.get('/api/vacancies/:id/applications', async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request()
    .input('VacancyId', sql.Int, req.params.id)
    .query(`
        SELECT
          va.ApplicationId, va.CurrentStage, va.AppliedAt, va.UpdatedAt,
          c.id as candidateId, c.first_name, c.last_name, c.email, c.applied_role, c.current_location
        FROM Vacancy_Applications va
        JOIN candidates c ON c.id = va.CandidateId
        WHERE va.VacancyId = @VacancyId
        ORDER BY va.AppliedAt DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("DETAIL QUERY FAILED:", err);
    res.status(500).json({ error: err.message });
  }
});

// Stage Move API - Candidate ko aage badhana
app.put('/api/applications/:id/move', async (req, res) => {
  try {
    const { toStage, notes } = req.body; // toStage = 'Interview', 'Hired' etc
    const pool = await sql.connect();
    
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
    // Agar invalid stage naam diya to yahi error aayega
    if(err.message.includes('CK_VA_Stage')) {
      return res.status(400).json({ error: `Invalid stage. Use: Applied, Screening, Shortlisted, Interview, Assessment, Offer, Hired, Rejected, On Hold` });
    }
    res.status(500).json({ error: err.message });
  }
});

// History dekhne ke liye
app.get('/api/applications/:id/history', async (req,res)=>{
  const pool = await sql.connect();
  const result = await pool.request()
    .input('AppId', sql.Int, req.params.id)
    .query(`SELECT * FROM Application_Stage_History WHERE ApplicationId=@AppId ORDER BY ChangedAt DESC`);
  res.json(result.recordset);
});

// **************************************************
// DASHBOARD API - FINAL
//***************************************************
app.get('/api/dashboard', async (req, res) => {
  try {
    const pool = await getPool();

    // 1. Counts
    const counts = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Vacancies) as totalVacancies,
        (SELECT COUNT(*) FROM Vacancies WHERE Status IN ('Active','Published')) as openJobs,
        (SELECT COUNT(*) FROM Vacancies WHERE Status IN ('Closed','Filled')) as closedJobs,
        (SELECT COUNT(*) FROM candidates) as totalCandidates,
        (SELECT COUNT(*) FROM Vacancy_Applications) as totalApplications,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Interview') as interviews,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Hired') as hired,
        (SELECT COUNT(*) FROM Vacancy_Applications WHERE CurrentStage = 'Screening') as screening
    `);

    // 2. Pipeline - Tumhare 7 stages ke liye
    const pipelineResult = await pool.request().query(`
      SELECT CurrentStage as stage, COUNT(*) as count
      FROM Vacancy_Applications
      GROUP BY CurrentStage
    `);
    // Frontend const STAGES se match karne ke liye map banao
    const STAGES = ['Applied','Screening','Interview','Offer','Hired','Rejected','On Hold'];
    const pipelineMap = {};
    pipelineResult.recordset.forEach(r => pipelineMap[r.stage] = r.count);
    const pipeline = STAGES.map(s => ({ stage: s, count: pipelineMap[s] || 0 }));

    // 3. Department wise vacancies
    const deptResult = await pool.request().query(`
      SELECT COALESCE(d.DepartmentName, 'N/A') as name, COUNT(v.VacancyId) as value
      FROM Vacancies v
      LEFT JOIN Master_Departments d ON d.DepartmentId = v.DepartmentId
      GROUP BY d.DepartmentName
    `);

    // 4. Recent Vacancies - 5 latest
    const recentVac = await pool.request().query(`
      SELECT TOP 5 v.VacancyId as id, v.JobTitle as title, v.Status as status,
             COALESCE(d.DepartmentName,'N/A') as department,
             (SELECT COUNT(*) FROM Vacancy_Applications va WHERE va.VacancyId = v.VacancyId) as applicants
      FROM Vacancies v
      LEFT JOIN Master_Departments d ON d.DepartmentId = v.DepartmentId
      ORDER BY v.CreatedAt DESC
    `);

    // 5. Recent Applications - 5 latest
    const recentApp = await pool.request().query(`
      SELECT TOP 5 va.ApplicationId as id, c.first_name + ' ' + c.last_name as candidateName,
             v.JobTitle as jobTitle, va.CurrentStage as stage, va.AppliedAt as appliedAt
      FROM Vacancy_Applications va
      JOIN candidates c ON c.id = va.CandidateId
      JOIN Vacancies v ON v.VacancyId = va.VacancyId
      ORDER BY va.AppliedAt DESC
    `);

    const c = counts.recordset[0];

    res.json({
      stats: {
        openJobs: c.openJobs,
        totalVacancies: c.totalVacancies,
        closedJobs: c.closedJobs,
        totalCandidates: c.totalCandidates,
        totalApplications: c.totalApplications,
        interviews: c.interviews,
        hired: c.hired,
        screening: c.screening
      },
      pipeline, // [{stage:'Applied',count:0},...]
      departmentWise: deptResult.recordset,
      recentVacancies: recentVac.recordset,
      recentApplications: recentApp.recordset
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
// **************************************************
// DASHBOARD API CLOSED
// **************************************************

// **************************************************
// GLOBAL SEARCH API - Vacancies + Candidates + Applications
//***************************************************
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

    const all = [...vacResult.recordset,...candResult.recordset,...appResult.recordset];
    res.json(all);

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});



const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📦 Connected to recru on U3IT2\\BCDEMO`);
});
