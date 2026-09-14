import React, { useState, useEffect } from "react";
import {
  Briefcase, FileText, DollarSign, MapPin, Building2, ListPlus, Trash2, CheckCircle2, Eye, GraduationCap, Sparkles, Loader2,
} from "lucide-react";
import ConfirmModal from "../../Components/ConfirmModel";

const API_BASE = "http://localhost:5000/api";

export default function CreateVacancyForm({ vacancyIdProp, onSuccess }) {
  const vacancyId = vacancyIdProp;
  const isEditMode = !!vacancyId;

  const [formData, setFormData] = useState({
    jobTitle: "", department: "", employmentType: "Full-time", workspace: "Hybrid", location: "", jobSummary: "",
    experienceLevel: "Mid-level (3-5 years)", minSalary: "", maxSalary: "", currency: "INR", isSalaryPublic: true, status: "Active",
  });

  const [responsibilities, setResponsibilities] = useState([""]);
  const [qualifications, setQualifications] = useState([""]);
  const [skills, setSkills] = useState([""]);
  const [masters, setMasters] = useState({ departments: [], employmentTypes: [], workspaces: [], experienceLevels: [], skills: [], qualifications: [], locations: [] });
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [loadingVacancy, setLoadingVacancy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [modal, setModal] = useState({
    open: false,
    title: "",
    showCancel: false,
    okText: "OK",
    onOk: () => { }
  });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const showAlertModal = (title) => {
    setModal({
      open: true,
      title: title,
      showCancel: false,
      okText: "OK",
      onOk: closeModal,
      onCancel: closeModal
    });
  };

  const showSuccessModal = (id) => {
    setModal({
      open: true,
      title: `${isEditMode ? 'Updated' : 'Published'} Successfully!\nVacancy ID: ${id}`,
      showCancel: false,
      okText: "Go to List",
      onOk: () => {
        closeModal();
        if (onSuccess) onSuccess();
      },
      onCancel: closeModal
    });
  };
  useEffect(() => {
    async function fetchMasters() {
      try {
        const res = await fetch(`${API_BASE}/masters`);
        const data = await res.json();
        setMasters(data);
        if (data.departments.length > 0 && !formData.department && !isEditMode) {
          setFormData(prev => ({ ...prev, department: data.departments[0].DepartmentName }));
        }
      } catch (err) {
        console.error("Failed to load masters:", err);
      } finally {
        setLoadingMasters(false);
      }
    }
    fetchMasters();
  }, []);

  useEffect(() => {
    if (!isEditMode || loadingMasters) return;
    async function fetchVacancy() {
      setLoadingVacancy(true);
      try {
        const res = await fetch(`${API_BASE}/vacancies/${vacancyId}`);
        const data = await res.json();
        setFormData({
          jobTitle: data.jobTitle || "", department: data.department || "", employmentType: data.employmentType || "Full-time",
          workspace: data.workspace || "Hybrid", location: data.location || "", jobSummary: data.jobSummary || "",
          experienceLevel: data.experienceLevel || "Mid-level (3-5 years)", minSalary: data.minSalary || "", maxSalary: data.maxSalary || "",
          currency: "INR", isSalaryPublic: data.isSalaryPublic ?? true, status: data.status || "Active",
        });
        if (data.responsibilities?.length) setResponsibilities(data.responsibilities);
        if (data.qualifications?.length) setQualifications(data.qualifications);
        if (data.skills?.length) setSkills(data.skills);
      } catch (err) { console.error(err); }
      finally { setLoadingVacancy(false); }
    }
    fetchVacancy();
  }, [vacancyId, loadingMasters]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const handleListChange = (setter, list, index, value) => { const updated = [...list]; updated[index] = value; setter(updated); };
  const addListItem = (setter, list) => setter([...list, ""]);
  const removeListItem = (setter, list, index) => { if (list.length > 1) setter(list.filter((_, idx) => idx !== index)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.minSalary && formData.maxSalary && parseFloat(formData.minSalary) > parseFloat(formData.maxSalary)) {
      showAlertModal("Min salary cannot be greater than Max salary");
      return;
    }
    setSubmitting(true);
    const finalPayload = {
      ...formData,
      minSalary: formData.minSalary ? parseFloat(formData.minSalary) : null,
      maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : null,
      responsibilities: responsibilities.filter((item) => item.trim() !== ""),
      qualifications: qualifications.filter((item) => item.trim() !== ""),
      skills: skills.filter((item) => item.trim() !== ""),
    };
    try {
      const url = isEditMode ? `${API_BASE}/vacancies/${vacancyId}` : `${API_BASE}/vacancies`;
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(finalPayload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedId(data.vacancyId || vacancyId);
      const newId = data.vacancyId || vacancyId;
      showSuccessModal(newId)
    } catch (err) {
      showAlertModal(`Failed to ${isEditMode ? 'update' : 'publish'} vacancy\n${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMasters || loadingVacancy) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50/50">
        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="h-5 w-5 animate-spin" /> {isEditMode ? "Loading vacancy..." : "Loading masters..."}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10">
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-6 py-6 sm:px-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEditMode ? `Edit Job Vacancy ${vacancyId}` : "Create New Job Vacancy"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase className="h-5 w-5" /></span>
              <h2>Core Job Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <div className="sm:col-span-2 xl:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Job Title <span className="text-red-500">*</span></label>
                <input type="text" name="jobTitle" required placeholder="e.g. Senior Full Stack Developer" value={formData.jobTitle} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select name="department" required value={formData.department} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Department</option>
                    {masters.departments.map((dept) => (<option key={dept.DepartmentId} value={dept.DepartmentName}>{dept.DepartmentName}</option>))}
                  </select>
                </div>
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Employment Type</label>
                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  {masters.employmentTypes.map((et) => (<option key={et.EmploymentTypeId} value={et.TypeName}>{et.TypeName}</option>))}
                </select>
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Workspace</label>
                <select name="workspace" value={formData.workspace} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  {masters.workspaces.map((ws) => (<option key={ws.WorkspaceId} value={ws.WorkspaceName}>{ws.WorkspaceName}</option>))}
                </select>
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select name="location" required value={formData.location} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Location</option>
                    {masters.locations.map((loc) => (<option key={loc.LocationId} value={`${loc.City}, ${loc.State || ''}`.trim()}>{`${loc.City}, ${loc.State || ''}`.trim()}</option>))}
                  </select>
                </div>
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Status <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select name="status" required value={formData.status} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Active">Active</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                    <option value="Filled">Filled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="h-5 w-5" /></span>
              <h2>Description & Key Criteria</h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Job Summary <span className="text-red-500">*</span></label>
                <textarea name="jobSummary" required rows={4} placeholder="Provide a comprehensive breakdown..." value={formData.jobSummary} onChange={handleInputChange} className="w-full p-4 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="xl:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Experience Level</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleInputChange} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  {masters.experienceLevels.map((exp) => (<option key={exp.ExperienceLevelId} value={exp.LevelName}>{exp.LevelName}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3"><Briefcase className="h-4 w-4 text-blue-600" /><label className="text-sm font-semibold text-gray-900">Responsibilities</label></div>
                  <div className="space-y-3 mt-4">
                    {responsibilities.map((resp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" placeholder={`Responsibility - ${idx + 1}`} value={resp} onChange={(e) => handleListChange(setResponsibilities, responsibilities, idx, e.target.value)} className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button type="button" onClick={() => removeListItem(setResponsibilities, responsibilities, idx)} disabled={responsibilities.length === 1} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 rounded-md hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => addListItem(setResponsibilities, responsibilities)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-gray-200/60"><ListPlus className="h-4 w-4" /> Add Responsibility</button>
              </div>

              <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4 text-blue-600" /><label className="text-sm font-semibold text-gray-900">Qualifications</label></div>
                  <div className="space-y-3 mt-4">
                    {qualifications.map((qual, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select value={qual} onChange={(e) => handleListChange(setQualifications, qualifications, idx, e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="">B.Tech in CSE / MCA</option>
                          {masters.qualifications.map((q) => (<option key={q.QualificationId} value={q.QualificationName}>{q.QualificationName}</option>))}
                        </select>
                        <button type="button" onClick={() => removeListItem(setQualifications, qualifications, idx)} disabled={qualifications.length === 1} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 rounded-md hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => addListItem(setQualifications, qualifications)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-gray-200/60"><ListPlus className="h-4 w-4" /> Add Qualification</button>
              </div>

              <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-blue-600" /><label className="text-sm font-semibold text-gray-900">Required Skills</label></div>
                  <div className="space-y-3 mt-4">
                    {skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select value={skill} onChange={(e) => handleListChange(setSkills, skills, idx, e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                          <option value="">React.js, Tailwind CSS</option>
                          {masters.skills.map((s) => (<option key={s.SkillId} value={s.SkillName}>{s.SkillName}</option>))}
                        </select>
                        <button type="button" onClick={() => removeListItem(setSkills, skills, idx)} disabled={skills.length === 1} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 rounded-md hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => addListItem(setSkills, skills)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-gray-200/60"><ListPlus className="h-4 w-4" /> Add Skill</button>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="h-5 w-5" /></span>
              <h2>Compensation Package (INR ₹)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Minimum Salary (₹)</label>
                <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 text-sm">₹</span><input type="number" name="minSalary" placeholder="e.g. 500000" value={formData.minSalary} onChange={handleInputChange} className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Maximum Salary (₹)</label>
                <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 text-sm">₹</span><input type="number" name="maxSalary" placeholder="e.g. 900000" value={formData.maxSalary} onChange={handleInputChange} className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <div className="sm:col-span-2 xl:col-span-1 pt-1 sm:pt-6">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100/70">
                  <input type="checkbox" name="isSalaryPublic" checked={formData.isSalaryPublic} onChange={handleInputChange} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                  <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-gray-500" /> Show salary on candidate job board</div>
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => onSuccess && onSuccess()} className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {isEditMode ? "Updating..." : "Publishing..."}</> : <><CheckCircle2 className="h-4 w-4" /> {isEditMode ? "Update Vacancy" : "Publish Vacancy"}</>}
            </button>
          </div>
        </form>
      </div>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        showCancel={modal.showCancel}
        okText={modal.okText}
        cancelText="Cancel"
        onOk={modal.onOk}
        onCancel={modal.onCancel || closeModal}
      />
    </div>
  );
}