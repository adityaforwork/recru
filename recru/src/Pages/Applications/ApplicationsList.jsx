import React, { useEffect, useState } from "react";
import { Briefcase, Users, Clock, ChevronRight, Search, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

const API_BASE = "http://localhost:5000/api";
// Pehle ye tha
// const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

// Ab ye kar do - tumhare dropdown ke saare options
const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On Hold'];

// Pipeline Component - Isi file me rakha hai
function RecruitmentPipeline({ candidates = [], activeStage, onStageChange }) {
  const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On Hold'];
  const getCount = (stage) => candidates.filter(c => c.CurrentStage === stage).length;

  const getStageStyle = (stage, isActive) => {
    if (isActive) return 'bg-blue-600 text-white border-blue-600';
    if (stage === 'Rejected') return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
    if (stage === 'On Hold') return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200';
    return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50';
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
        Recruitment Pipeline
      </h3>

      <div className="flex items-center gap-2.5 flex-wrap">
        {STAGES.map((stage, idx) => {
          const isActive = activeStage === stage;
          return (
            <div key={stage} className="flex items-center gap-2.5">
              <button
                onClick={() => onStageChange(stage)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 shadow-sm cursor-pointer ${getStageStyle(stage, isActive)}`}
              >
                <span>{stage}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm transition-colors ${isActive
                  ? 'bg-white/20 border-white/10 text-white'
                  : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}>
                  {getCount(stage)}
                </span>
              </button>

              {/* Upgraded Step Indicator Arrow */}
              {idx < 4 && (
                <svg
                  className="w-4 h-4 text-slate-300 shrink-0 mx-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

}

export default function ApplicationsList() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState('Screening'); // Default Screening kyuki tumhare 2 candidates Screening me hai

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/applications/summary`);
      const data = await res.json();
      setSummary(Array.isArray(data) ? data : []);
    } catch (e) { setSummary([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, []);

  const openVacancy = async (vacancy) => {
    setSelectedVacancy(vacancy);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vacancies/${vacancy.id}/applications`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCandidates(list);
      // Auto-set active stage jisme sabse zyada candidates hai
      if (list.length > 0) setActiveStage(list[0].CurrentStage);
    } catch (e) { setCandidates([]); }
    finally { setDetailLoading(false); }
  };

  const handleMoveStage = async (appId, newStage) => {
    if (!confirm(`${newStage} me move karna hai?`)) return;
    const res = await fetch(`${API_BASE}/applications/${appId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: newStage })
    });
    const data = await res.json();
    if (res.ok) {
      setCandidates(prev => prev.map(c => c.ApplicationId === appId ? { ...c, CurrentStage: newStage } : c));
    } else {
      alert("Error: " + data.error);
    }
  };

  const filteredSummary = summary.filter(j =>
    j.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
    j.id?.toString().includes(search)
  );

  const filteredCandidates = candidates.filter(c => c.CurrentStage === activeStage);

  if (loading) {
    return <div className="w-full h- flex flex-col items-center justify-center gap-2"><Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm text-gray-500">Loading...</span></div>
  }

  if (selectedVacancy) {
    return (
      <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-10 space-y-6">

        {/* Navigation Action */}
        <button
          onClick={() => setSelectedVacancy(null)}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Applications</span>
        </button>

        {/* Vacancy Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {selectedVacancy.jobTitle}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">ID: {selectedVacancy.id}</span>
              <span className="text-slate-300">•</span>
              <span>{selectedVacancy.department}</span>
              <span className="text-slate-300">•</span>
              <span>{selectedVacancy.location}</span>
            </p>
          </div>
          <div className="text-right shrink-0 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
            <div className="text-2xl font-black text-slate-800 tracking-tight">{candidates.length}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Total Candidates</div>
          </div>
        </div>

        {/* Recruitment Pipeline Integration Component */}
        <RecruitmentPipeline candidates={candidates} activeStage={activeStage} onStageChange={setActiveStage} />

        {/* Candidates Table Grid Layer */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/70 backdrop-blur sticky top-0 border-b border-slate-100 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stage</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applied</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailLoading ? (
                  <tr>
                    <td colSpan="4" className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-blue-600 w-8 h-8 stroke-[2.5]" />
                        <span className="text-xs font-medium text-slate-400">Loading candidates...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-16 text-center text-slate-400 font-medium text-sm">
                      No candidates currently matching <span className="text-slate-600 font-semibold bg-slate-50 px-1.5 py-0.5 rounded">"{activeStage}"</span>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map(app => (
                    <tr key={app.ApplicationId} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 text-[14px]">
                          {app.first_name} {app.last_name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-medium">{app.email}</div>
                      </td>
                      <td className="p-4 vertical-middle">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full text-xs font-semibold inline-flex items-center">
                          {app.CurrentStage}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-medium vertical-middle">
                        {app.AppliedAt ? new Date(app.AppliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4 text-right pr-6 vertical-middle">
                        <select
                          value={app.CurrentStage}
                          onChange={(e) => handleMoveStage(app.ApplicationId, e.target.value)}
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none shadow-sm hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all duration-150"
                        >
                          <option>Applied</option>
                          <option>Screening</option>
                          <option>Interview</option>
                          <option>Offer</option>
                          <option>Hired</option>
                          <option>Rejected</option>
                          <option>On Hold</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-10 space-y-6">

      {/* Header Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Applications</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Total <span className="text-slate-900 font-semibold">{filteredSummary.reduce((a, b) => a + (b.totalCandidates || 0), 0)}</span> applications across <span className="text-slate-900 font-semibold">{filteredSummary.length}</span> vacancies
          </p>
        </div>

        {/* Refined Search Box */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Job..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
          />
        </div>
      </div>

      {/* Vacancies Grid List */}
      <div className="grid gap-4.5">
        {filteredSummary.map(job => (
          <div
            key={job.id}
            onClick={() => openVacancy(job)}
            className="group bg-white border border-slate-200 hover:border-blue-500/60 rounded-2xl p-6 flex justify-between items-center transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            {/* Left Block: Identity Meta */}
            <div className="space-y-1.5 min-w-0 pr-4">
              <div className="font-semibold text-[15px] text-slate-800 flex items-center gap-2.5 truncate">
                <Briefcase className="w-4.5 h-4.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                <span className="truncate">{job.jobTitle}</span>
                <span className="text-xs text-slate-400 font-mono bg-slate-100 group-hover:bg-slate-200/60 px-1.5 py-0.5 rounded transition-colors shrink-0">#{job.id}</span>
              </div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{job.department}</span>
                <span className="text-slate-300">•</span>
                <span className="truncate">{job.location}</span>
              </div>
            </div>

            {/* Right Block: Stats Counter & CTA */}
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <div className="text-2xl font-black text-slate-800 tracking-tight flex items-baseline gap-1.5">
                <Users className="w-4 h-4 text-slate-400 self-center" />
                {job.totalCandidates}
              </div>
              <div className="text-xs font-semibold text-blue-600 group-hover:text-blue-500 flex items-center justify-end gap-0.5 mt-1 transition-colors">
                <span>View</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

}