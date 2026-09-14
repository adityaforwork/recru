import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Eye,
  Trash2,
  Pencil,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import BulkUploadModal from "./BulkUploadModal";
import VacancyPickerModal from "../../Components/VacancyPickerModal";
import ConfirmModal from "../../Components/ConfirmModel"
// format ctc
const formatCTC = (val) => {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
    return '—';
  }
  return Number(val).toLocaleString("en-IN");
};
export default function CandidateList({ onAddNewCandidate, onEdit, onViewProfile }) {

  // useState
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: "", showCancel: true, onOk: () => { } });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));
  // useNavigate
  const navigate = useNavigate()

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
      currentStage: c.currentStage, // backend se aa raha hai,
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
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/candidates');
        const data = await res.json();

        const formatted = data.map(c => ({
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          phone: c.phone,
          currentCity: c.current_location,
          appliedRole: c.applied_role,
          currentCompany: c.current_employer,
          experienceYears: c.experience_years ?? 0,
          currentSalary: c.current_ctc, // NULL ho sakta hai
          expectedSalary: c.expected_ctc, // NULL ho sakta hai
          noticePeriod: c.notice_period,
          source: c.application_source,
          skills: c.skills ? c.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          // YE 3 FIELD MISSING THE - YEHI FIX HAI
          currentStage: c.currentStage || c.current_stage || null,
          lastJobTitle: c.lastJobTitle || c.last_job_title || null,
          totalApplications: c.totalApplications || 0,
          status: c.currentStage || 'Not Applied',
          appliedDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
          resumePath: c.resume_path
        }));
        setCandidates(formatted);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  // Loading dikhao
  if (loading) {
    return <div className="p-10 text-center">Loading candidates from DB...</div>
  }
  // Multiple Select & Single Select Coding Logic
  const toggleOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]); // saare hatado
    } else {
      setSelectedIds(filteredCandidates.map(c => c.id)); // saare select
    }
  };



  // ****************************************************************************************** 
  //                            Bulk Operation Performing Functions 
  // ******************************************************************************************
  // Handle Bulk Delete - Candidates
  const handleBulkDelete = () => {
    setConfirm({
      open: true,
      title: `Total candidates selected - ${selectedIds.length} are you sure you want to delete these selected candidates.\nThis action is irreversible.`,
      showCancel: true,
      onOk: async () => {
        closeConfirm();
        const res = await fetch('http://localhost:5000/api/candidates/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        });
        const data = await res.json();
        if (res.ok) {
          setCandidates(prev => prev.filter(c => !selectedIds.includes(c.id)));
          setSelectedIds([]);
          setConfirm({ open: true, title: data.message || "Deleted successfully", showCancel: false, onOk: closeConfirm });
        }
      }
    });
  };

  // Handle Bulk Add To Job
  const handleBulkAddToJob = () => {
    if (selectedIds.length === 0) return;
    setIsVacancyModalOpen(true);
  };

  const confirmAddToJob = async (vacancyId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/vacancies/${vacancyId}/add-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: selectedIds })
      });
      const data = await res.json();
      if (res.ok) {
        setConfirm({ open: true, title: data.message || "Added to job", showCancel: false, onOk: closeConfirm });
        setIsVacancyModalOpen(false);
        setSelectedIds([]);
      } else {
        setConfirm({ open: true, title: "Error: " + data.message, showCancel: false, onOk: closeConfirm });
      }
    } catch (err) {
      setConfirm({ open: true, title: "Failed: " + err.message, showCancel: false, onOk: closeConfirm });
    }
  };
  const handleDelete = (id) => {
    setConfirm({
      open: true,
      title: `Delete this candidate?\nThis action is irreversible.`,
      showCancel: true,
      onOk: async () => {
        closeConfirm();
        try {
          const res = await fetch(`http://localhost:5000/api/candidates/${id}`, { method: "DELETE" });
          if (res.ok) setCandidates(prev => prev.filter(c => c.id !== id));
          else setConfirm({ open: true, title: "Delete failed. \n Unable to delete due to some error.", showCancel: false, onOk: closeConfirm });
        } catch (e) { console.error(e); }
      }
    });
  };


  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Add this before closing </div> */}
      <VacancyPickerModal
        isOpen={isVacancyModalOpen}
        onClose={() => setIsVacancyModalOpen(false)}
        selectedCount={selectedIds.length}
        onConfirm={confirmAddToJob}
      />
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
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[60vh]">

        {/* 1. Bulk Bar ko scroll ke BAHAR rakho aur sticky banao */}
        {selectedIds.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-tl-2xl rounded-tr-2xl shadow-2xl backdrop-blur-md shrink-0 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            {/* Left Section: Selected Counter */}
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black ring-1 ring-emerald-500/30">
                {selectedIds.length}
              </div>
              <span className="text-sm font-semibold tracking-wide text-slate-200">
                Items Selected
              </span>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleBulkAddToJob}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-900/30 transition-all duration-200 flex items-center gap-1.5"
              >
                <span>Add to Job</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="p-2 bg-slate-800 hover:bg-red-950 border border-slate-700 hover:border-red-900 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-200"
                title="Delete Selected"
              >
                <Trash2 size={16} />
              </button>

              <div className="h-4 w-[1px] bg-slate-800 mx-1" /> {/* Subtle Divider */}

              <button
                onClick={() => setSelectedIds([])}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all duration-200 text-xs flex items-center justify-center"
                title="Clear Selection"
              >
                <X size={16} /> {/* Replaced "X" text with Lucide Icon */}
              </button>
            </div>
          </div>
        )}


        {/* 2. Sirf table wale div ko scroll do */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text- tracking-wider top-0 z-10 sticky">
              <tr>
                <th className="py-3.5 px-4 w-10"><input type="checkbox" checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length} onChange={toggleAll} className="rounded border-zinc-300 text-emerald-600 accent-emerald-600 checked:bg-emerald-600 checked:border-emerald-600 focus:ring-emerald-600 h-4 w-4 transition-all cursor-pointer" /></th>
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
                <tr><td colSpan="8" className="text-center py-10 text-gray-400">No candidates found.</td></tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.id} className={`${selectedIds.includes(c.id) ? 'bg-blue-50' : 'hover:bg-gray-50/60'} transition-colors`}>
                    <td className="py-4 px-4"><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleOne(c.id)} className="rounded border-zinc-300 text-emerald-600 accent-emerald-600 checked:bg-emerald-600 checked:border-emerald-600 focus:ring-emerald-600 h-4 w-4 transition-all cursor-pointer" /></td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{c.firstName} {c.lastName}</div>
                      <div className="flex flex-col gap-0.5 text-xs text-gray-500 mt-1">
                        <a
                          href={`mailto:${c.email?.trim()}`}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors group"
                        >
                          <Mail className="h-3 w-3 text-gray-400 group-hover:text-gray-900" />
                          <span className="group-hover:underline underline-offset-2">{c.email}</span>
                        </a>

                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors group"
                        >
                          <Phone className="h-3 w-3 text-gray-400 group-hover:text-gray-900" />
                          <span className="group-hover:underline underline-offset-2">{c.phone}</span>
                        </a>

                        <span className="flex items-center gap-1.5 text-gray-400">
                          <MapPin className="h-3 w-3" /> {c.currentCity}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">{c.appliedRole}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                        {c.skills.slice(0, 3).map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded text- font-medium">{sk}</span>
                        ))}
                        {c.skills.length > 3 && <span className="text- text-gray-400 self-center">+{c.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{c.experienceYears} Years</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Briefcase className="h-3 w-3 text-gray-400" /> {c.currentCompany}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 flex items-center gap-0.5"><IndianRupee className="h-3.5 w-3.5 text-emerald-600" />{formatCTC(c.expectedSalary)}</div>
                      <div className="text- text-gray-400">Current: ₹{formatCTC(c.currentSalary)}</div>
                    </td>
                    <td className="py-4 px-6"><span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{c.noticePeriod}</span></td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-medium border
                          ${c.currentStage === 'Hired' ? 'bg-green-50 text-green-700 border-green-200'
                          : c.currentStage === 'Offer' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.currentStage === 'Interview' ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : c.currentStage === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200'
                                : c.currentStage === 'On Hold' ? 'bg-gray-100 text-gray-600 border-gray-200'
                                  : c.currentStage === 'Applied' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.currentStage || 'Not Applied'}
                      </span>{c.lastJobTitle && <div className="text-[11px] text-gray-400 mt-1 truncate max-w-[120px]">{c.lastJobTitle}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onViewProfile(c.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100" title="View Profile">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => onEdit(c.id)} className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        showCancel={confirm.showCancel}
        onOk={confirm.onOk}
        onCancel={closeConfirm}
      />
    </div>

  );
}
