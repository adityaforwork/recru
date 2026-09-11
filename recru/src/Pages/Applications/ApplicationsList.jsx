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
    if(isActive) return 'bg-blue-600 text-white border-blue-600';
    if(stage === 'Rejected') return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
    if(stage === 'On Hold') return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200';
    return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50';
  };

  return (
    <div className="w-full bg-white border rounded-2xl p-4">
      <h3 className="text-sm font-bold mb-3">Recruitment Pipeline</h3>
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map((stage, idx) => {
          const isActive = activeStage === stage;
          return (
            <div key={stage} className="flex items-center gap-2">
              <button
                onClick={() => onStageChange(stage)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-all flex items-center gap-2 ${getStageStyle(stage, isActive)}`}
              >
                {stage} <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border text-gray-700">{getCount(stage)}</span>
              </button>
              {idx < 4 && <span className="text-gray-400">→</span>}
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
      setSummary(Array.isArray(data)? data : []);
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
      const list = Array.isArray(data)? data : [];
      setCandidates(list);
      // Auto-set active stage jisme sabse zyada candidates hai
      if(list.length > 0) setActiveStage(list[0].CurrentStage);
    } catch(e) { setCandidates([]); }
    finally { setDetailLoading(false); }
  };

  const handleMoveStage = async (appId, newStage) => {
    if(!confirm(`${newStage} me move karna hai?`)) return;
    const res = await fetch(`${API_BASE}/applications/${appId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStage: newStage })
    });
    const data = await res.json();
    if(res.ok) {
      setCandidates(prev => prev.map(c => c.ApplicationId === appId? {...c, CurrentStage: newStage} : c));
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
      <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10 space-y-6">
        <button onClick={() => setSelectedVacancy(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </button>

        <div className="bg-white p-5 rounded-2xl border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{selectedVacancy.jobTitle}</h2>
            <p className="text-xs text-gray-500">ID: {selectedVacancy.id} • {selectedVacancy.department} • {selectedVacancy.location}</p>
          </div>
          <div className="text-right"><div className="text-2xl font-bold">{candidates.length}</div><div className="text-xs text-gray-500">Total Candidates</div></div>
        </div>

        {/* PIPELINE AB YAHAN ACTIVE HOGA */}
        <RecruitmentPipeline candidates={candidates} activeStage={activeStage} onStageChange={setActiveStage} />

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="overflow-y-auto max-h-">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 sticky top-0 border-b">
                <tr><th className="p-3">Candidate</th><th className="p-3">Stage</th><th className="p-3">Applied</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody className="divide-y">
                {detailLoading? <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/></td></tr> :
                 filteredCandidates.length === 0? <tr><td colSpan="4" className="p-10 text-center text-gray-400">No candidates in {activeStage}</td></tr> :
                  filteredCandidates.map(app => (
                    <tr key={app.ApplicationId} className="hover:bg-gray-50">
                      <td className="p-3"><div className="font-bold">{app.first_name} {app.last_name}</div><div className="text-xs text-gray-500">{app.email}</div></td>
                      <td className="p-3"><span className="px-2.5 py-1 bg-amber-50 text-amber-700 border rounded-full text-xs">{app.CurrentStage}</span></td>
                      <td className="p-3 text-xs text-gray-500">{app.AppliedAt? new Date(app.AppliedAt).toLocaleDateString() : '-'}</td>
                      <td className="p-3">
                        <select value={app.CurrentStage} onChange={(e)=>handleMoveStage(app.ApplicationId, e.target.value)} className="text-xs border rounded-md px-2 py-1 bg-white">
                          <option>Applied</option><option>Screening</option><option>Interview</option><option>Offer</option><option>Hired</option><option>Rejected</option><option>On Hold</option>
                        </select>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border">
        <div><h2 className="text-xl font-bold">Applications</h2><p className="text-xs text-gray-500">Total {filteredSummary.reduce((a,b)=>a+(b.totalCandidates||0),0)} applications in {filteredSummary.length} vacancies</p></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Job..." className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm" /></div>
      </div>
      <div className="grid gap-4">
        {filteredSummary.map(job => (
          <div key={job.id} onClick={()=>openVacancy(job)} className="bg-white border rounded-xl p-5 flex justify-between items-center hover:border-blue-300 cursor-pointer">
            <div>
              <div className="font-bold flex gap-2 items-center"><Briefcase className="w-4 h-4"/>{job.jobTitle} <span className="text-gray-400 text-xs">#{job.id}</span></div>
              <div className="text-xs text-gray-500 mt-1">{job.department} • {job.location}</div>
            </div>
            <div className="text-right"><div className="text-2xl font-bold flex items-center gap-1 justify-end"><Users className="w-5 h-5"/>{job.totalCandidates}</div><div className="text-xs text-blue-600 flex items-center justify-end mt-2">View <ChevronRight className="w-4 h-4"/></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}