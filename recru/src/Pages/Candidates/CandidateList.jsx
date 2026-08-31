import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  UploadCloud,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  IndianRupee,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import BulkUploadModal from "./BulkUploadModal";

// Initial Mock Candidates
const initialCandidates = [
  {
    id: 1,
    firstName: "Rahul",
    lastName: "Verma",
    email: "rahul.verma@example.com",
    phone: "+91 98765 43210",
    currentCity: "Mohali, Punjab",
    appliedRole: "Senior Software Engineer",
    currentCompany: "Clerisy Solutions",
    experienceYears: 4.5,
    currentSalary: 650000,
    expectedSalary: 950000,
    noticePeriod: "30 Days",
    source: "LinkedIn",
    skills: ["React.js", "Node.js", "MySQL", "Tailwind CSS"],
    status: "Interview",
    appliedDate: "Aug 29, 2026",
  },
  {
    id: 2,
    firstName: "Priya",
    lastName: "Kaur",
    email: "priya.kaur@example.com",
    phone: "+91 98123 45678",
    currentCity: "Chandigarh",
    appliedRole: "HR Executive",
    currentCompany: "Talent Pro Corp",
    experienceYears: 2.0,
    currentSalary: 350000,
    expectedSalary: 500000,
    noticePeriod: "Immediate",
    source: "Naukri.com",
    skills: ["Talent Sourcing", "Screening", "Zoho Recruit", "Payroll"],
    status: "Screening",
    appliedDate: "Aug 28, 2026",
  },
  {
    id: 3,
    firstName: "Aman",
    lastName: "Deep",
    email: "aman.deep@example.com",
    phone: "+91 98999 11223",
    currentCity: "Ludhiana, Punjab",
    appliedRole: "Business Development Specialist",
    currentCompany: "Corporate Stalwarts",
    experienceYears: 3.0,
    currentSalary: 500000,
    expectedSalary: 750000,
    noticePeriod: "15 Days",
    source: "Employee Referral",
    skills: ["B2B Sales", "Lead Generation", "Zoho CRM", "Negotiation"],
    status: "Offer",
    appliedDate: "Aug 26, 2026",
  },
];

export default function CandidateList({ onAddNewCandidate }) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // 1. Download Blank Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "First Name": "Aarav",
        "Last Name": "Sharma",
        Email: "aarav.sharma@example.com",
        Phone: "+91 9876543210",
        City: "Mohali",
        "Applied Role": "Full Stack Developer",
        "Current Employer": "Tech Innovators",
        "Experience (Years)": 3,
        "Current CTC": 600000,
        "Expected CTC": 900000,
        "Notice Period": "30 Days",
        Source: "LinkedIn",
        Skills: "React.js, Node.js, MySQL",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidate_Template");
    XLSX.writeFile(workbook, "Candidate_Import_Template.xlsx");
  };

  // 2. Export Active Candidates to Excel
  const handleExportCandidates = () => {
    const exportData = candidates.map((c) => ({
      "Candidate ID": c.id,
      "Full Name": `${c.firstName} ${c.lastName}`,
      Email: c.email,
      Phone: c.phone,
      City: c.currentCity,
      "Applied Role": c.appliedRole,
      "Current Employer": c.currentCompany,
      "Experience (Yrs)": c.experienceYears,
      "Current CTC (₹)": c.currentSalary,
      "Expected CTC (₹)": c.expectedSalary,
      "Notice Period": c.noticePeriod,
      Source: c.source,
      Skills: c.skills.join(", "),
      Status: c.status,
      "Applied Date": c.appliedDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    XLSX.writeFile(
      workbook,
      `Candidates_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // 3. Callback from Bulk Modal
  const handleBulkUploadSuccess = (newCandidates) => {
    setCandidates((prev) => [...newCandidates, ...prev]);
  };

  // Filter List
  const filteredCandidates = candidates.filter((cand) => {
    const fullName = `${cand.firstName} ${cand.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      cand.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.appliedRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.skills.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesRole =
      selectedRole === "All" || cand.appliedRole === selectedRole;

    return matchesSearch && matchesRole;
  });

  const uniqueRoles = ["All", ...new Set(candidates.map((c) => c.appliedRole))];

  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Candidate Pool
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {candidates.length} active candidates in pipeline
          </p>
        </div>

        {/* Action Button Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Blank Template */}
          <button
            onClick={handleDownloadTemplate}
            title="Download formatted sample Excel sheet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Sample Template
          </button>

          {/* Export Candidates to Excel */}
          <button
            onClick={handleExportCandidates}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4 text-blue-600" />
            Export to Excel
          </button>

          {/* Bulk Upload Excel Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <UploadCloud className="h-4 w-4" />
            Bulk Upload Excel
          </button>

          {/* Manual Single Candidate Add */}
          {onAddNewCandidate && (
            <button
              onClick={onAddNewCandidate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              Add Candidate
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, role, or specific skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-transparent border-none text-xs font-medium text-gray-700 focus:outline-none cursor-pointer"
          >
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role === "All" ? "All Applied Roles" : role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-6">Applied Role</th>
                <th className="py-3.5 px-6">Experience & Employer</th>
                <th className="py-3.5 px-6">Expected CTC</th>
                <th className="py-3.5 px-6">Notice Period</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No candidates found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Candidate Name & Contact */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-gray-400" /> {c.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-gray-400" /> {c.phone}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                          <MapPin className="h-3 w-3" /> {c.currentCity}
                        </span>
                      </div>
                    </td>

                    {/* Applied Role & Skills */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">
                        {c.appliedRole}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                        {c.skills.slice(0, 3).map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded text-[10px] font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                        {c.skills.length > 3 && (
                          <span className="text-[10px] text-gray-400 self-center">
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience & Current Employer */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {c.experienceYears} Years
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="h-3 w-3 text-gray-400" />{" "}
                        {c.currentCompany}
                      </div>
                    </td>

                    {/* Expected Salary */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 flex items-center gap-0.5">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                        {Number(c.expectedSalary).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Current: ₹
                        {Number(c.currentSalary).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Notice Period */}
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                        {c.noticePeriod}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status === "Interview"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : c.status === "Offer"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="py-4 px-6 text-right">
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer">
                        Profile <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Upload Excel Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onUploadSuccess={handleBulkUploadSuccess}
      />
    </div>
  );
}
