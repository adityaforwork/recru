import { useEffect, useState } from "react";
import { Search, Briefcase, MapPin, Loader2, X } from "lucide-react";
const API_BASE = "http://localhost:5000/api";

export default function VacancyPickerModal({ isOpen, onClose, onConfirm, selectedCount }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE}/vacancies`).then(r => r.json()).then(d => { setVacancies(d); setLoading(false); });
  }, [isOpen]);

  const filtered = vacancies.filter(v =>
    v.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
    (v.id?.toString() || "").includes(search)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-in">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Add <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-extrabold">{selectedCount}</span> candidates to Job
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select vacancy or job where you want to add candidates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Job Title or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
            />
          </div>
        </div>

        {/* Job List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[45vh] scrollbar-thin">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600 w-8 h-8 stroke-[2.5]" />
              <span className="text-xs text-slate-400 font-medium tracking-wide">Loading vacancies...</span>
            </div>
          ) : (
            filtered.map(v => {
              const vid = v.id || v.VacancyId;
              const isSelected = selectedId === vid;
              return (
                <div
                  key={vid}
                  onClick={() => setSelectedId(vid)}
                  className={`p-4 border rounded-xl cursor-pointer flex justify-between items-center gap-4 transition-all duration-200 group relative ${isSelected
                      ? 'bg-blue-50/70 border-blue-600 shadow-sm shadow-blue-50'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 flex items-center gap-2 truncate">
                      <Briefcase className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`} />
                      <span className="truncate">{v.jobTitle}</span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-100 group-hover:bg-slate-200/60 px-1.5 py-0.5 rounded transition-colors shrink-0">#{vid}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.location}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate">{v.department}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${v.status?.toLowerCase() === 'active' || v.status?.toLowerCase() === 'open'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {v.status}
                      </span>
                    </div>
                  </div>

                  {/* Radio Button Selector */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${isSelected
                      ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-600/10 scale-105'
                      : 'border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50 duration-150" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 bg-white text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-50 active:bg-slate-100 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            disabled={!selectedId}
            onClick={() => onConfirm(selectedId)}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-600/15 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none transition-all duration-150"
          >
            Confirm & Create Application
          </button>
        </div>
      </div>
    </div>
  );

}