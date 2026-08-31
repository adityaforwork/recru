import React, { useState } from "react";
import {
  Briefcase,
  MapPin,
  Building2,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  GraduationCap,
  Sparkles,
  CheckCircle,
  PlusCircle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";

// Sample mock data matching the form schema
const initialVacancies = [
  {
    id: 1,
    jobTitle: "Senior Full Stack Developer",
    department: "Engineering",
    employmentType: "Full-time",
    workspace: "Hybrid",
    location: "Mohali, Punjab",
    experienceLevel: "Senior (5–8 years)",
    minSalary: 800000,
    maxSalary: 1400000,
    isSalaryPublic: true,
    jobSummary:
      "Looking for an experienced engineer to lead the backend architecture and modern React web frontend systems.",
    responsibilities: [
      "Architect and build resilient RESTful APIs using Node.js/PHP",
      "Collaborate with UI/UX teams to build modular React interfaces",
      "Mentor junior team members and conduct code reviews",
    ],
    qualifications: [
      "B.Tech in Computer Science or related field",
      "AWS Certified Developer (Preferred)",
    ],
    skills: ["React.js", "Node.js", "Tailwind CSS", "MySQL", "Docker"],
    postedDate: "Aug 29, 2026",
    status: "Active",
  },
  {
    id: 2,
    jobTitle: "Technical Business Development Specialist",
    department: "Sales & Strategy",
    employmentType: "Full-time",
    workspace: "On-site",
    location: "Chandigarh, India",
    experienceLevel: "Mid-level (3–5 years)",
    minSalary: 500000,
    maxSalary: 850000,
    isSalaryPublic: false,
    jobSummary:
      "Drive enterprise software client acquisitions, perform product demos, and manage corporate lineup operations.",
    responsibilities: [
      "Manage lead prospecting and outbound outreach campaigns",
      "Conduct in-depth product walk-throughs for prospective clients",
      "Coordinate with technical engineering teams for integration feasibility",
    ],
    qualifications: [
      "Bachelor's degree in Business, Marketing, or IT",
      "Demonstrated track record in B2B SaaS sales",
    ],
    skills: [
      "Zoho CRM",
      "Enterprise Sales",
      "Lead Generation",
      "Client Negotiation",
    ],
    postedDate: "Aug 27, 2026",
    status: "Active",
  },
];

export default function VacancyList({ onCreateNew }) {
  const [vacancies] = useState(initialVacancies);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Toggle detail expansion
  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  // Filter records based on search & department
  const filteredVacancies = vacancies.filter((job) => {
    const matchesSearch =
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesDept =
      filterDepartment === "All" || job.department === filterDepartment;

    return matchesSearch && matchesDept;
  });

  const departments = ["All", ...new Set(vacancies.map((v) => v.department))];

  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title, location, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "All" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vacancy Card List */}
      <div className="space-y-4">
        {filteredVacancies.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">
              No vacancies found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              No open positions match your search criteria. Try adjusting your
              query or post a new vacancy.
            </p>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4" /> Create Vacancy
              </button>
            )}
          </div>
        ) : (
          filteredVacancies.map((vacancy) => {
            const isExpanded = expandedCardId === vacancy.id;

            return (
              <div
                key={vacancy.id}
                className="bg-white border border-gray-200 rounded-xl shadow-xs transition-all hover:border-gray-300 overflow-hidden"
              >
                {/* Main Card Header */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                          {vacancy.jobTitle}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {vacancy.status}
                        </span>
                      </div>

                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {vacancy.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {vacancy.location}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {vacancy.workspace}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                          {vacancy.employmentType}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-3.5 w-3.5" />
                          {vacancy.postedDate}
                        </span>
                      </div>
                    </div>

                    {/* Right Side Info & Action */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      {/* Compensation */}
                      <div className="text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-1 text-base font-bold text-gray-900">
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                          <span>
                            {vacancy.minSalary.toLocaleString("en-IN")} -{" "}
                            {vacancy.maxSalary.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          {vacancy.isSalaryPublic ? (
                            <>
                              <Eye className="h-3 w-3 text-gray-400" /> Public
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 text-amber-500" />{" "}
                              Internal Only
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpand(vacancy.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            Less Details <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            View Details <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Snippet */}
                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                    {vacancy.jobSummary}
                  </p>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-5 sm:p-6 space-y-6">
                    {/* Experience Level & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-gray-200/60">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Experience Level
                        </span>
                        <span className="text-sm font-medium text-gray-900 mt-1 block">
                          {vacancy.experienceLevel}
                        </span>
                      </div>
                      <div className="md:col-span-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Detailed Purpose & Summary
                        </span>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                          {vacancy.jobSummary}
                        </p>
                      </div>
                    </div>

                    {/* Three Columns: Responsibilities, Qualifications, Skills */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Responsibilities */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Responsibilities
                        </div>
                        <ul className="space-y-2">
                          {vacancy.responsibilities.map((resp, i) => (
                            <li
                              key={i}
                              className="text-xs text-gray-600 flex items-start gap-2 leading-snug"
                            >
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Qualifications */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                          Qualifications
                        </div>
                        <ul className="space-y-2">
                          {vacancy.qualifications.map((qual, i) => (
                            <li
                              key={i}
                              className="text-xs text-gray-600 flex items-start gap-2 leading-snug"
                            >
                              <span className="text-purple-500 font-bold">
                                •
                              </span>
                              <span>{qual}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Required Skills */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          Required Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {vacancy.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
