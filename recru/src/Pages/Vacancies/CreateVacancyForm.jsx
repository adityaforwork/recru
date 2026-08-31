import React, { useState } from "react";
import {
  Briefcase,
  FileText,
  DollarSign,
  MapPin,
  Building2,
  ListPlus,
  Trash2,
  CheckCircle2,
  Eye,
  Info,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function CreateVacancyForm() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    employmentType: "Full-time",
    workspace: "Hybrid",
    location: "",
    jobSummary: "",
    experienceLevel: "Mid-level (3–5 years)",
    minSalary: "",
    maxSalary: "",
    currency: "INR",
    isSalaryPublic: true,
  });

  // Dynamic lists
  const [responsibilities, setResponsibilities] = useState([""]);
  const [qualifications, setQualifications] = useState([""]);
  const [skills, setSkills] = useState([""]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // List management helpers
  const handleListChange = (setter, list, index, value) => {
    const updated = [...list];
    updated[index] = value;
    setter(updated);
  };

  const addListItem = (setter, list) => {
    setter([...list, ""]);
  };

  const removeListItem = (setter, list, index) => {
    if (list.length > 1) {
      setter(list.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalPayload = {
      ...formData,
      responsibilities: responsibilities.filter((item) => item.trim() !== ""),
      qualifications: qualifications.filter((item) => item.trim() !== ""),
      skills: skills.filter((item) => item.trim() !== ""),
    };
    console.log("Submitted Job Details:", finalPayload);
    alert("Job posting created successfully!");
  };

  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10">
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="border-b border-gray-200 bg-white px-6 py-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Create New Job Vacancy
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure job parameters, qualifications, skills, and
                compensation.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium self-start sm:self-center border border-blue-100">
              <Info className="h-4 w-4" /> Auto-Generated ID Enabled
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-12">
          {/* ================= SECTION 1: CORE JOB DETAILS ================= */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Briefcase className="h-5 w-5" />
              </span>
              <h2>Core Job Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {/* Job Title */}
              <div className="sm:col-span-2 xl:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  required
                  placeholder="e.g. Senior Full Stack Developer"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Department */}
              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="department"
                    required
                    placeholder="e.g. Engineering, Sales, HR"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Employment Type */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Workspace */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Workspace
                </label>
                <select
                  name="workspace"
                  value={formData.workspace}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                >
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Location */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    required
                    placeholder="e.g. Mohali, Punjab"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 2: DESCRIPTION & REQUIREMENTS ================= */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </span>
              <h2>Description & Key Criteria</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Job Summary */}
              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Job Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="jobSummary"
                  required
                  rows={4}
                  placeholder="Provide a comprehensive breakdown of the role's purpose, scope, and day-to-day impact..."
                  value={formData.jobSummary}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y placeholder:text-gray-400"
                />
              </div>

              {/* Experience Level */}
              <div className="xl:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                >
                  <option value="Entry-level (0–2 years)">
                    Entry-level (0–2 years)
                  </option>
                  <option value="Mid-level (3–5 years)">
                    Mid-level (3–5 years)
                  </option>
                  <option value="Senior (5–8 years)">Senior (5–8 years)</option>
                  <option value="Lead / Executive (8+ years)">
                    Lead / Executive (8+ years)
                  </option>
                </select>
              </div>
            </div>

            {/* Dynamic Lists Section (Responsibilities, Qualifications, Skills) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              {/* Responsibilities */}
              <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block">
                        Responsibilities
                      </label>
                      <span className="text-xs text-gray-500">
                        Core duties & deliverables.
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {responsibilities.map((resp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Duty #${idx + 1}`}
                          value={resp}
                          onChange={(e) =>
                            handleListChange(
                              setResponsibilities,
                              responsibilities,
                              idx,
                              e.target.value,
                            )
                          }
                          className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeListItem(
                              setResponsibilities,
                              responsibilities,
                              idx,
                            )
                          }
                          disabled={responsibilities.length === 1}
                          className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addListItem(setResponsibilities, responsibilities)
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-gray-200/60"
                >
                  <ListPlus className="h-4 w-4" /> Add Responsibility
                </button>
              </div>

              {/* Qualifications */}
              <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block">
                        Qualifications
                      </label>
                      <span className="text-xs text-gray-500">
                        Degrees & certifications.
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {qualifications.map((qual, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`e.g. B.Tech in CSE / MCA`}
                          value={qual}
                          onChange={(e) =>
                            handleListChange(
                              setQualifications,
                              qualifications,
                              idx,
                              e.target.value,
                            )
                          }
                          className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeListItem(
                              setQualifications,
                              qualifications,
                              idx,
                            )
                          }
                          disabled={qualifications.length === 1}
                          className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addListItem(setQualifications, qualifications)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-gray-200/60"
                >
                  <ListPlus className="h-4 w-4" /> Add Qualification
                </button>
              </div>

              {/* Required Skills */}
              <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <div>
                      <label className="text-sm font-semibold text-gray-900 block">
                        Required Skills
                      </label>
                      <span className="text-xs text-gray-500">
                        Tech stack, tools & skills.
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`e.g. React.js, Tailwind CSS`}
                          value={skill}
                          onChange={(e) =>
                            handleListChange(
                              setSkills,
                              skills,
                              idx,
                              e.target.value,
                            )
                          }
                          className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setSkills, skills, idx)}
                          disabled={skills.length === 1}
                          className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addListItem(setSkills, skills)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-4 pt-2 border-t border-gray-200/60"
                >
                  <ListPlus className="h-4 w-4" /> Add Skill
                </button>
              </div>
            </div>
          </section>

          {/* ================= SECTION 3: SALARY & COMPENSATION ================= */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </span>
              <h2>Compensation Package (INR ₹)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {/* Min Salary */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Minimum Salary (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="minSalary"
                    placeholder="e.g. 500000"
                    value={formData.minSalary}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Max Salary */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Maximum Salary (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="maxSalary"
                    placeholder="e.g. 900000"
                    value={formData.maxSalary}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Visibility Option */}
              <div className="sm:col-span-2 xl:col-span-1 pt-1 sm:pt-6">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors">
                  <input
                    type="checkbox"
                    id="isSalaryPublic"
                    name="isSalaryPublic"
                    checked={formData.isSalaryPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-700 font-medium select-none flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                    Show salary on candidate job board
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* ================= ACTIONS ================= */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publish Vacancy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
