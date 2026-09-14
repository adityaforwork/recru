import React, { useState, useEffect } from "react";
import ConfirmModal from "../../Components/ConfirmModel";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Link2,
  FileUp,
  IndianRupee,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Building,
  ArrowLeft,
} from "lucide-react";

export default function CreateCandidate({ candidateId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentCity: "",
    appliedRole: "",
    currentCompany: "",
    currentDesignation: "",
    experienceYears: "",
    currentSalary: "",
    expectedSalary: "",
    noticePeriod: "Immediate",
    source: "LinkedIn",
    portfolioUrl: "",
    linkedinUrl: "",
    highestEducation: "",
    candidateNotes: "",
  });
  // useStates
  const [skills, setSkills] = useState(["React.js", "Tailwind CSS"]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [modal, setModal] = useState({ open: false, title: "" });
  const closeModal = () => setModal({ open: false, title: "" });
  // input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // add skills handler
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  // remove skills handler
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  // file chnage handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = new FormData();

      // React state -> SQL column mapping
      submitData.append('first_name', formData.firstName);
      submitData.append('last_name', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('current_location', formData.currentCity);
      submitData.append('highest_qualification', formData.highestEducation);
      submitData.append('applied_role', formData.appliedRole);
      submitData.append('current_employer', formData.currentCompany);
      submitData.append('experience_years', formData.experienceYears);
      submitData.append('current_ctc', formData.currentSalary);
      submitData.append('expected_ctc', formData.expectedSalary);
      submitData.append('notice_period', formData.noticePeriod);
      submitData.append('application_source', formData.source);
      submitData.append('linkedin_url', formData.linkedinUrl);
      submitData.append('portfolio_url', formData.portfolioUrl);
      submitData.append('recruiter_notes', formData.candidateNotes);

      // Important: Skills are need to send in json string
      submitData.append('skills', JSON.stringify(skills));

      // Resume file
      if (resumeFile) {
        submitData.append('resume', resumeFile);
      }

      const url = candidateId ? `http://localhost:5000/api/candidates/${candidateId}` : 'http://localhost:5000/api/candidates';
      const response = await fetch(url, {
        method: candidateId ? 'PUT' : 'POST',
        body: submitData,
      });
      const result = await response.json();

      if (response.ok) {
        setModal({
          open: true,
          title: `Candidate ${candidateId ? 'Updated' : 'Added'} Successfully!\nID: ${result.id || candidateId}`
        });
      } else {
        setModal({ open: true, title: `Error: ${result.error}` });
      }

    } catch (err) {
      console.error(err);
      setModal({ open: true, title: "Server error, check console\nBackend running on port 5000?" });
    }
  };

  // // agar candidateId hai to edit mode
  useEffect(() => {
    if (candidateId) {
      fetch(`http://localhost:5000/api/candidates/${candidateId}`)
        .then(r => r.json())
        .then(data => {
          setFormData({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            currentCity: data.current_location || "",
            appliedRole: data.applied_role || "",
            currentCompany: data.current_employer || "",
            experienceYears: data.experience_years || "",
            currentSalary: data.current_ctc || "",
            expectedSalary: data.expected_ctc || "",
            noticePeriod: data.notice_period || "Immediate",
            source: data.application_source || "LinkedIn",
            portfolioUrl: data.portfolio_url || "",
            linkedinUrl: data.linkedin_url || "",
            highestEducation: data.highest_qualification || "",
            candidateNotes: data.recruiter_notes || "",
            currentDesignation: "",
          });
          if (data.skills) {
            setSkills(data.skills.split(",").filter(Boolean));
          }
        });
    }
  }, [candidateId]);




  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10">
      <button
        type="button"
        onClick={onCancel}
        className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Candidates
      </button>
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-6 sm:px-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {candidateId ? "Update Candidate Details" : "Create New Candidate"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {candidateId ? "Update candidate profile details, work history, and attach application documents." : "Enter candidate profile details, work history, and attach application documents."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-12">
          {/* ================= SECTION 1: PERSONAL & CONTACT ================= */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <User className="h-5 w-5" />
              </span>
              <h2>Personal & Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="e.g. Rahul"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="e.g. Sharma"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. rahul.sharma@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Current Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Current Location / City{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="currentCity"
                    required
                    placeholder="e.g. Mohali, Punjab"
                    value={formData.currentCity}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Highest Education */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Highest Qualification
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="highestEducation"
                    placeholder="e.g. B.Tech Computer Science"
                    value={formData.highestEducation}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 2: PROFESSIONAL EXPERIENCE ================= */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Briefcase className="h-5 w-5" />
              </span>
              <h2>Professional Experience & Role Matching</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Applied Role */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Applied Role / Position{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="appliedRole"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.appliedRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Current Company */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Current Employer
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="currentCompany"
                    placeholder="e.g. TechCorp Solutions"
                    value={formData.currentCompany}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Total Experience */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="experienceYears"
                  placeholder="e.g. 3.5"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Current CTC */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Current CTC (₹ / Annum)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="currentSalary"
                    placeholder="e.g. 650000"
                    value={formData.currentSalary}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Expected CTC */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Expected CTC (₹ / Annum)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-gray-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="expectedSalary"
                    placeholder="e.g. 950000"
                    value={formData.expectedSalary}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Notice Period
                </label>
                <select
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                >
                  <option value="Immediate">Immediate Joiner</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days (1 Month)</option>
                  <option value="60 Days">60 Days (2 Months)</option>
                  <option value="90 Days">90 Days (3 Months)</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Application Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Naukri">Naukri.com</option>
                  <option value="Company Careers">Company Careers Page</option>
                  <option value="Employee Referral">Employee Referral</option>
                  <option value="Direct Walk-in">Direct Walk-in</option>
                </select>
              </div>
            </div>

            {/* Interactive Skills Tagging Field */}
            <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <label className="text-sm font-semibold text-gray-900">
                  Key Skills & Proficiencies
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill (e.g. React.js, Python, Figma) and press Add..."
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSkill(e);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-800 shadow-2xs"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ================= SECTION 3: ATTACHMENTS & SOCIAL LINKS ================= */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Link2 className="h-5 w-5" />
              </span>
              <h2>Links & Document Attachment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LinkedIn URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Portfolio / GitHub URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Portfolio / GitHub Link
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  placeholder="https://github.com/username"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Resume File Upload Dropzone */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Upload Resume / CV (PDF, DOCX)
                </label>
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition-all">
                  <FileUp className="h-8 w-8 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {resumeFile
                      ? resumeFile.name
                      : "Click to browse or drag file here"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Candidate Notes / Remarks */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Interviewer / Recruiter Notes
                </label>
                <textarea
                  name="candidateNotes"
                  rows={3}
                  placeholder="Add any initial screener observations, communication feedback, or specific details..."
                  value={formData.candidateNotes}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y placeholder:text-gray-400"
                />
              </div>
            </div>
          </section>

          {/* ================= ACTIONS ================= */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {candidateId ? "Update Details" : "Save New Candidate"}
            </button>
          </div>
        </form>
      </div>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        showCancel={false}
        okText="Done"
        onOk={() => {
          const wasSuccess = modal.title.includes("Successfully");
          closeModal();
          if (wasSuccess && onSuccess) onSuccess(); // ye sahi jagah hai
        }}
        onCancel={closeModal}
      />
    </div>
  );
}
