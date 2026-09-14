import React, { useState, useEffect, useMemo } from "react";
const API = "http://localhost:5000";

export default function Interviews() {
  const [vacancies, setVacancies] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [applications, setApplications] = useState([]);
  const [loadingVac, setLoadingVac] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [search, setSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [activeTab, setActiveTab] = useState("pipeline");
  const [scheduled, setScheduled] = useState([]);
  const [loadingSch, setLoadingSch] = useState(false);
  const [schSearch, setSchSearch] = useState("");
  const [existingInterviews, setExistingInterviews] = useState([]);

  // Reschedule ke liye
  const [editingInterview, setEditingInterview] = useState(null);
  const isRescheduling = !!editingInterview;

  const [form, setForm] = useState({
    date: "", time: "", duration: "60", interviewType: "Technical", round: "Round 1",
    mode: "Onsite", venue: "Dera Bassi Office", building: "", floorRoom: "",
    platform: "Google Meet", meetingLink: "", meetingId: "", passcode: "",
    interviewer: "", notes: ""
  });

  // 3. Reschedule pe date ke liye
  const toDateInput = (d) => {
    if (!d) return "";
    // new Date() se IST shift hota hai, isliye split se kaam karo
    if (typeof d === 'string' && d.includes('T')) {
      return d.split('T')[0]; // "2026-09-12"
    }
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  };
  // 1. DB se time ko input me dikhane ke liye - BINA Date ke
  const toTimeInput = (t) => {
    if (!t) return "";
    // Agar "15:31:00" ya "15:31:00.0000000" aaya
    if (/^\d{2}:\d{2}/.test(t)) {
      return t.slice(0, 5); // "15:31"
    }
    // Agar ISO aaya "1900-01-01T15:31:00.000Z" - to bhi sirf time nikaalo, Date object mat banao
    if (typeof t === 'string' && t.includes('T')) {
      const timePart = t.split('T')[1]; // "15:31:00.000Z"
      return timePart.slice(0, 5);
    }
    return "";
  };

  const fetchVacancies = async () => {
    setLoadingVac(true);
    try {
      const res = await fetch(`${API}/api/vacancies/`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.recordset || data.data || [];
      setVacancies(list);
      if (list.length && !selectedId) {
        const firstId = list[0].VacancyId ?? list[0].id ?? list[0].Id;
        setSelectedId(firstId);
      }
    } catch (e) { setVacancies([]); }
    setLoadingVac(false);
  };

  const fetchApplications = async (vacancyId) => {
    if (!vacancyId) return;
    setLoadingApps(true);
    try {
      const res = await fetch(`${API}/api/vacancies/${vacancyId}/interview-applications`);
      const data = await res.json();
      let list = Array.isArray(data) ? data : data.recordset || data.data || data.applications || [];
      const mapped = list.map(a => {
        const appId = a.ApplicationId ?? a.applicationId ?? a.Id ?? a.id;
        const candidateName = a.CandidateName || a.candidateName || a.Name || `${a.first_name || a.FirstName || ""} ${a.last_name || a.LastName || ""}`.trim() || `Candidate #${appId}`;
        return {
          ApplicationId: appId,
          CandidateId: a.CandidateId || a.candidateId,
          CandidateName: candidateName || "Unknown Candidate",
          Email: a.Email || a.email || a.CandidateEmail || "",
          Phone: a.Phone || a.phone || "",
          CurrentStage: (a.CurrentStage || a.currentStage || "").trim(),
          AppliedAt: a.AppliedAt || a.appliedAt
        };
      }).filter(a => a.CurrentStage === "Interview");
      setApplications(mapped);
    } catch (e) { setApplications([]); }
    setLoadingApps(false);
  };

  const fetchScheduled = async () => {
    setLoadingSch(true);
    try {
      const res = await fetch(`${API}/api/interviews`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.recordset || [];
      setScheduled(list);
      setExistingInterviews(list);
    } catch (e) { setScheduled([]); }
    setLoadingSch(false);
  };

  useEffect(() => { fetchVacancies(); fetchScheduled(); }, []);
  useEffect(() => { if (selectedId) { fetchApplications(selectedId); setSelected([]); } }, [selectedId]);
  useEffect(() => { if (activeTab === 'scheduled') fetchScheduled(); }, [activeTab]);

  const selectedVacancy = useMemo(() => vacancies.find(v => (v.VacancyId ?? v.id) == selectedId), [vacancies, selectedId]);
  const filteredVac = useMemo(() => vacancies.filter(v => `${v.JobTitle || v.jobTitle} ${v.VacancyId || v.id} ${v.Location || v.location}`.toLowerCase().includes(search.toLowerCase())), [vacancies, search]);
  const filteredApps = useMemo(() => applications.filter(a => `${a.CandidateName} ${a.Email} ${a.ApplicationId}`.toLowerCase().includes(candidateSearch.toLowerCase())), [applications, candidateSearch]);
  const filteredScheduled = useMemo(() => scheduled.filter(s => `${s.CandidateName} ${s.JobTitle} ${s.Interviewer} ${s.CandidateEmail} ${s.Notes || ''}`.toLowerCase().includes(schSearch.toLowerCase())), [scheduled, schSearch]);

  const checkSlotConflict = (date, time, interviewer, duration) => {
    if (!date || !time) return null;
    const newStart = new Date(`${date}T${time}`);
    const newEnd = new Date(newStart.getTime() + parseInt(duration || 60) * 60000);
    for (let iv of existingInterviews) {
      if (iv.Status !== 'Scheduled') continue;
      if (isRescheduling && iv.InterviewId === editingInterview.InterviewId) continue; // khud ko skip karo reschedule pe
      const ivDate = toDateInput(iv.InterviewDate);
      if (ivDate !== date) continue;
      const ivTime = toTimeInput(iv.InterviewTime);
      const existStart = new Date(`${ivDate}T${ivTime}`);
      const existEnd = new Date(existStart.getTime() + (iv.Duration || 60) * 60000);
      const isOverlap = newStart < existEnd && newEnd > existStart;
      if (isOverlap) {
        if (selected.includes(iv.ApplicationId)) return `Candidate ${iv.CandidateName} ka already interview hai ${formatTime(iv.InterviewTime)} pe`;
        if (interviewer && iv.Interviewer && iv.Interviewer.toLowerCase() === interviewer.toLowerCase()) return `Interviewer ${interviewer} busy hai ${formatTime(iv.InterviewTime)} pe (${iv.CandidateName})`;
      }
    }
    return null;
  };

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const moveToStage = async (appId, toStage) => {
    try {
      const res = await fetch(`${API}/api/applications/${appId}/move`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, notes: `Moved to ${toStage} from Interview` })
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      fetchApplications(selectedId); fetchVacancies();
    } catch (err) { alert(err.message); }
  };

  // === SCHEDULE + RESCHEDULE - SAME FORM ===
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (form.mode === "Virtual" && !form.meetingLink) return alert("Please paste Meeting Link");
    const conflictMsg = checkSlotConflict(form.date, form.time, form.interviewer, form.duration);
    if (conflictMsg) return alert(`❌ Slot Conflict: ${conflictMsg}`);

    try {
      if (isRescheduling) {
        // RESCHEDULE - PUT
        const res = await fetch(`${API}/api/interviews/${editingInterview.InterviewId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            InterviewDate: form.date, InterviewTime: form.time, Duration: form.duration,
            Venue: form.venue, Mode: form.mode, MeetingLink: form.meetingLink,
            Interviewer: form.interviewer, Notes: form.notes, Platform: form.platform
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.reason || data.error);
        alert("✅ Interview Rescheduled");
      } else {
        // NEW SCHEDULE - POST
        for (let appId of selected) {
          const res = await fetch(`${API}/api/interviews`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ApplicationId: appId, VacancyId: selectedId, ...form, InterviewDate: form.date, InterviewTime: form.time })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.reason || data.error);
        }
        alert("✅ Interview Scheduled Successfully");
      }
      setShowModal(false);
      setEditingInterview(null);
      setForm({ date: "", time: "", duration: "60", interviewType: "Technical", round: "Round 1", mode: "Onsite", venue: "Dera Bassi Office", building: "", floorRoom: "", platform: "Google Meet", meetingLink: "", meetingId: "", passcode: "", interviewer: "", notes: "" });
      fetchApplications(selectedId); fetchScheduled();
    } catch (err) { alert(err.message); }
  };

  const formatDate = (d) => { if (!d) return "—"; const date = new Date(d); return isNaN(date.getTime()) ? "—" : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
  // 2. Input se 24h ko 12h display ke liye
  const formatTime = (timeVal) => {
    if (!timeVal) return "—";
    const clean = toTimeInput(timeVal); // hamesha "HH:MM" milega
    if (!clean) return "—";
    const [hStr, m] = clean.split(':');
    let h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this interview?")) return;
    await fetch(`${API}/api/interviews/${id}`, { method: "DELETE" });
    fetchScheduled();
  };

  const handleRescheduleClick = (iv) => {
    // Yahi tum chahte the - wahi form open ho notes ke saath
    setEditingInterview(iv);
    setForm({
      date: toDateInput(iv.InterviewDate),
      time: toTimeInput(iv.InterviewTime),
      duration: String(iv.Duration || "60"),
      interviewType: iv.InterviewType || "Technical",
      round: iv.Round || "Round 1",
      mode: iv.Mode || "Onsite",
      venue: iv.Venue || "Dera Bassi Office",
      building: iv.Building || "",
      floorRoom: iv.FloorRoom || "",
      platform: iv.Platform || "Google Meet",
      meetingLink: iv.MeetingLink || "",
      meetingId: iv.MeetingId || "",
      passcode: iv.Passcode || "",
      interviewer: iv.Interviewer || "",
      notes: iv.Notes || "" // Notes bhi pre-fill hoga
    });
    setShowModal(true);
  };

  const handleNewSchedule = (appId = null) => {
    setEditingInterview(null);
    if (appId) setSelected([appId]);
    setForm({ date: "", time: "", duration: "60", interviewType: "Technical", round: "Round 1", mode: "Onsite", venue: "Dera Bassi Office", building: "", floorRoom: "", platform: "Google Meet", meetingLink: "", meetingId: "", passcode: "", interviewer: "", notes: "" });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f6f8] text-zinc-900 antialiased">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#f5f6f8]/80 border-b border-zinc-200/60">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              {/* Clean, authoritative title layout */}
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Interviews
              </h1>

              {/* Micro-pill Tab Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${activeTab === 'pipeline'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span>Pipeline</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'pipeline' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {vacancies.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('scheduled')}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-semibold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${activeTab === 'scheduled'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span>Scheduled</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'scheduled' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {scheduled.length}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {activeTab === 'pipeline' && (
            <button onClick={() => selected.length && handleNewSchedule()} disabled={!selected.length} className="h-9 px-5 rounded-full bg-black text-white text-xs font-medium disabled:opacity-30 hover:bg-zinc-800 transition">
              Schedule Interview • {selected.length} selected
            </button>
          )}
        </div>
      </div>

      {activeTab === 'scheduled' ? (
        <div className="mx-auto px-6 py-6">
          <div className="bg-white rounded- border border-slate-200 shadow-sm overflow-hidden">

            {/* Header - compact */}
            <div className="h-20 px-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text- text-slate-900">All Scheduled Interviews</h2>
                  <span className="text- font-bold bg-slate-900 text-white px-2 py-0.2 rounded-full">{filteredScheduled.length}</span>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-3-3" /></svg>
                </span>
                <input value={schSearch} onChange={e => setSchSearch(e.target.value)} placeholder="Search..." className="w- h-8 bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 text- outline-none focus:bg-white focus:border-slate-900 transition-all" />
              </div>
            </div>

            {loadingSch ? (
              <div className="py-20 text-center text- font-bold tracking-widest text-slate-400 uppercase">Loading...</div>
            ) : filteredScheduled.length === 0 ? (
              <div className="py-20 text-center"><p className="text- font-semibold">No interviews</p></div>
            ) : (
              <div className="overflow-x-hidden"> {/* scroller removed */}
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50/80 text- font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 w-[22%] font-bold">Candidate</th>
                      <th className="px-4 py-3 w-[16%] font-bold">Job Role</th>
                      <th className="px-4 py-3 w-[18%] font-bold">Schedule</th>
                      <th className="px-4 py-3 w-[18%] font-bold">Mode / Venue</th>
                      <th className="px-4 py-3 w-[12%] font-bold">Interviewer</th>
                      <th className="px-4 py-3 w-[14%] font-bold text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredScheduled.map(iv => (
                      <tr key={iv.InterviewId} className="hover:bg-slate-50/60 group">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-900 text-white grid place-items-center text- font-bold shrink-0">{iv.CandidateName?.[0]}</div>
                            <div className="min-w-0">
                              <div className="font-semibold text- text-slate-900 truncate leading-tight">{iv.CandidateName}</div>
                              <div className="text- text-slate-400 truncate">#{iv.ApplicationId} • {iv.CandidateEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text- font-medium text-slate-700 truncate">{iv.JobTitle}</div>
                          <div className="text- text-slate-400 font-mono">VAC-{iv.VacancyId}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text- font-semibold text-slate-900 leading-none">{formatDate(iv.InterviewDate)} <span className="font-normal text-slate-500">{formatTime(iv.InterviewTime)}</span></div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text- px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">{iv.Duration}m</span>
                            <span className="text- px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700 font-bold uppercase">{iv.Round}</span>
                            <span className="text- px-1.5 py-0.5 rounded bg-slate-900 text-white font-bold">{iv.Status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text- font-bold px-2 py-0.5 rounded-full border ${iv.Mode === 'Onsite' ? 'bg-white text-slate-600' : 'bg-violet-50 text-violet-700 border-violet-100'}`}>{iv.Mode}</span>
                          <div className="text- text-slate-400 truncate mt-1 max-w-">{iv.Mode === 'Onsite' ? iv.Venue : iv.MeetingLink}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text- font-medium text-slate-700 truncate">{iv.Interviewer || <span className="text-slate-300">—</span>}</div>
                          {iv.Notes && <div className="text- text-slate-400 truncate max-w-">{iv.Notes}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-right pr-4">
                          <div className="inline-flex gap-1">
                            <button onClick={() => handleRescheduleClick(iv)} className="h-6 px-2.5 rounded-full bg-white border border-slate-200 text- font-medium hover:bg-slate-900 hover:text-white transition-colors">Reschedule</button>
                            <button onClick={() => handleDelete(iv.InterviewId)} className="h-6 w-6 rounded-full bg-white border border-slate-200 grid place-items-center text- text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      ) : (
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 grid grid-cols-12 gap-5">
          {/* Job List Sidebar Container */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[calc(100vh-110px)] overflow-hidden">

              {/* Search Input Box */}
              <div className="p-3.5 border-b border-zinc-100">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">⌕</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search jobs, ID, location"
                    className="w-full h-10 bg-zinc-100 rounded-full pl-10 pr-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/10 border border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Scrollable Job List Area */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loadingVac ? (
                  // Skeleton Loaders
                  [1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)
                ) : (
                  // Job Vacancy Dynamic Cards
                  filteredVac.map(v => {
                    const vId = v.VacancyId ?? v.id;
                    const active = selectedId == vId;

                    return (
                      <button
                        key={vId}
                        onClick={() => setSelectedId(vId)}
                        className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${active
                          ? "bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-950 shadow-md transform scale-[0.99]"
                          : "bg-white border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50/30"
                          }`}
                      >
                        {/* Card Header: Job Title & Interview Count */}
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                            {v.JobTitle || v.jobTitle}
                          </h3>
                        </div>

                        {/* Card Footer: Job ID & Location */}
                        <div className={`mt-3 text-xs flex items-center gap-1.5 ${active ? "text-emerald-200/80" : "text-zinc-500"
                          }`}>
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${active ? "bg-white/10 text-emerald-100" : "bg-zinc-100 text-zinc-600"
                            }`}>
                            {vId}
                          </span>
                          <span className={active ? "text-emerald-700" : "text-zinc-400"}>•</span>
                          <span className="truncate">{v.Location || v.location}</span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

            </div>
          </div>

          {/* Candidate List and Vacancy Detail View Container */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-[calc(100vh-110px)] overflow-hidden">

              {!selectedVacancy ? (
                // Empty State: Displayed when no vacancy is highlighted from the sidebar
                <div className="flex-1 grid place-items-center text-sm text-zinc-500 font-medium">
                  Select a vacancy
                </div>
              ) : (
                <>
                  {/* Detail View Header Section */}
                  <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                      <div>
                        {/* Vacancy Identity & Meta Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-bold text-zinc-900">
                            {selectedVacancy.JobTitle || selectedVacancy.jobTitle}
                          </h2>
                          <span className="text-[10px] bg-emerald-950 text-emerald-100 px-2.5 py-0.5 rounded-full font-mono font-medium tracking-wide">
                            {selectedVacancy.VacancyId || selectedVacancy.id}
                          </span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold tracking-wider">
                            INTERVIEW
                          </span>
                        </div>

                        {/* Secondary Details: Metrics and Timing */}
                        <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span>{selectedVacancy.Location || selectedVacancy.location}</span>
                        </p>
                      </div>

                      {/* Context Search Area inside Header */}
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">⌕</span>
                        <input
                          value={candidateSearch}
                          onChange={e => setCandidateSearch(e.target.value)}
                          placeholder="Search candidate..."
                          className="w-64 h-10 bg-zinc-100 rounded-full pl-10 pr-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-950/20 border border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Candidates Feed */}
                  <div className="flex-1 overflow-auto">
                    {loadingApps ? (
                      // Dynamic Skeleton Loading Blocks
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}
                      </div>
                    ) : filteredApps.length === 0 ? (
                      // No Results/Fallback View Container
                      <div className="h-full grid place-items-center p-10 text-center">
                        <p className="text-sm font-medium text-zinc-500">No candidates in Interview</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">

                        {/* Data Table Sticky Tracking Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-3 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 z-10">
                          <input
                            type="checkbox"
                            checked={selected.length === filteredApps.length && filteredApps.length > 0}
                            onChange={e => setSelected(e.target.checked ? filteredApps.map(a => a.ApplicationId) : [])}
                            className="rounded border-zinc-300 text-emerald-600 accent-emerald-600 checked:bg-emerald-600 checked:border-emerald-600 focus:ring-emerald-600 h-4 w-4 transition-all cursor-pointer"
                          />
                          <span className="flex-1 pl-1">Candidate</span>
                          <span className="w-32 hidden md:block">Stage</span>
                          <span className="w-40 text-right">Actions</span>
                        </div>

                        {/* Interactive Candidate Grid Blocks */}
                        {filteredApps.map(app => (
                          <div key={app.ApplicationId} className="px-5 py-4 flex items-center gap-4 hover:bg-emerald-50/10 transition-colors group">

                            {/* Select Checkbox element */}
                            <input
                              type="checkbox"
                              checked={selected.includes(app.ApplicationId)}
                              onChange={() => toggle(app.ApplicationId)}
                              /* Combined accent and checked modifiers ensure the checkbox stays premium emerald green when active */
                              className="rounded border-zinc-300 text-emerald-600 accent-emerald-600 checked:bg-emerald-600 checked:border-emerald-600 focus:ring-emerald-600 h-4 w-4 transition-all cursor-pointer"
                            />


                            {/* Candidate Identity Meta Block */}
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              {/* Dynamic Monogram Avatar */}
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-950 text-emerald-50 grid place-items-center font-bold text-xs shrink-0 shadow-sm">
                                {app.CandidateName[0]?.toUpperCase()}
                              </div>

                              {/* Information Labels */}
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-zinc-800 truncate group-hover:text-emerald-950 transition-colors">
                                  {app.CandidateName}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 truncate mt-0.5">
                                  <span className="font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[10px]">
                                    #{app.ApplicationId}
                                  </span>
                                  <span className="truncate text-zinc-400">{app.Email || "no email"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status Pipeline Tag */}
                            <div className="w-32 hidden md:block">
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold tracking-wider inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
                                INTERVIEW
                              </span>
                            </div>

                            {/* Interactive Target Actions Area */}
                            <div className="w-40 flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleNewSchedule(app.ApplicationId)}
                                className="h-8 px-3.5 rounded-full bg-emerald-950 text-white text-xs font-semibold hover:bg-emerald-900 transition-all shadow-sm active:scale-[0.98]"
                              >
                                Schedule
                              </button>
                              <button
                                onClick={() => moveToStage(app.ApplicationId, "On Hold")}
                                className="h-8 px-3 rounded-full bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all active:scale-[0.98]"
                              >
                                Hold
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 transition-all duration-300">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => { setShowModal(false); setEditingInterview(null); }}
          />

          {/* Form Panel */}
          <form
            onSubmit={handleSchedule}
            className="relative bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 md:zoom-in-95 border border-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  {isRescheduling ? "Reschedule Interview" : "Schedule Interview"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {isRescheduling
                    ? `Interview #${editingInterview.InterviewId} • ${editingInterview.CandidateName}`
                    : `${selected.length} candidates • Vacancy ${selectedId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingInterview(null); }}
                className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Fields Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              {/* Date & Time Input Rows */}
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Date *
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="mt-1.5 w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Time *
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="mt-1.5 w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </label>
              </div>

              {/* Dynamic Conflict Banner Message */}
              {(() => {
                const msg = checkSlotConflict(form.date, form.time, form.interviewer, form.duration);
                return msg ? (
                  <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 p-3.5 rounded-xl flex items-center gap-2 animate-in shake duration-300">
                    <span className="shrink-0 text-base">⚠️</span> <span>{msg}</span>
                  </p>
                ) : null;
              })()}

              {/* Modern Segmented Mode Selector Button Panel */}
              <div className="flex gap-1 p-1 bg-slate-100 border border-slate-200/30 rounded-xl w-fit">
                {["Onsite", "Virtual", "Telephonic"].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, mode: m })}
                    className={`px-4 h-8 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${form.mode === m
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Mode Conditional Inputs Context Fields */}
              {form.mode === "Onsite" ? (
                <input
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                  placeholder="Dera Bassi Office - Venue"
                  className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              ) : form.mode === "Virtual" ? (
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 shadow-inner">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={form.platform}
                      onChange={e => setForm({ ...form, platform: e.target.value })}
                      className="h-11 border border-slate-200 rounded-xl px-3 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white font-medium cursor-pointer shadow-sm"
                    >
                      <option>Google Meet</option>
                      <option>Zoom</option>
                      <option>Microsoft Teams</option>
                      <option>Other</option>
                    </select>
                    <input
                      value={form.meetingId}
                      onChange={e => setForm({ ...form, meetingId: e.target.value })}
                      placeholder="Meeting ID"
                      className="h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-all font-medium"
                    />
                  </div>
                  <input
                    required={form.mode === "Virtual"}
                    value={form.meetingLink}
                    onChange={e => setForm({ ...form, meetingLink: e.target.value })}
                    placeholder="Paste meeting link * https://..."
                    className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-all font-medium"
                  />
                  <input
                    value={form.passcode}
                    onChange={e => setForm({ ...form, passcode: e.target.value })}
                    placeholder="Passcode (optional)"
                    className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-all font-medium"
                  />
                </div>
              ) : (
                <input
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                  placeholder="Call instructions"
                  className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              )}

              {/* Global Common Inputs */}
              <input
                value={form.interviewer}
                onChange={e => setForm({ ...form, interviewer: e.target.value })}
                placeholder="Interviewer name"
                className="w-full h-11 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes..."
                className="w-full min-h-[100px] border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium resize-none"
              />
            </div>

            {/* Footer Drawer Action Bar */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingInterview(null); }}
                className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 active:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-600/15"
              >
                {isRescheduling ? "Update Interview" : "Confirm & Send"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}