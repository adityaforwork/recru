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
    fetch(`${API_BASE}/vacancies`).then(r=>r.json()).then(d=>{ setVacancies(d); setLoading(false); });
  }, [isOpen]);

  const filtered = vacancies.filter(v =>
    v.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
    (v.id?.toString() || "").includes(search)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h- flex flex-col">
        <div className="p-5 border-b flex justify-between">
          <div>
            <h3 className="font-bold">Add {selectedCount} candidates to Job</h3>
            <p className="text-xs text-gray-500">Select vacancy - application will be created in Vacancy_Applications</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Job Title or ID..." className="w-full pl-10 py-2.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading? <div className="p-10 flex justify-center"><Loader2 className="animate-spin"/></div> :
            filtered.map(v => {
              const vid = v.id || v.VacancyId;
              return (
                <div key={vid} onClick={()=>setSelectedId(vid)} className={`p-4 border rounded-xl cursor-pointer flex justify-between ${selectedId===vid? 'bg-blue-50 border-blue-600' : 'hover:bg-gray-50'}`}>
                  <div>
                    <div className="font-semibold text-sm flex gap-2"><Briefcase className="w-4 h-4"/>{v.jobTitle} <span className="text-gray-400 font-normal">#{vid}</span></div>
                    <div className="text-xs text-gray-500 flex gap-2 mt-1"><MapPin className="w-3 h-3"/>{v.location} | {v.department} | {v.status}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${selectedId===vid? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}></div>
                </div>
              )
            })
          }
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          <button disabled={!selectedId} onClick={()=>onConfirm(selectedId)} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">Confirm & Create Application</button>
        </div>
      </div>
    </div>
  );
}