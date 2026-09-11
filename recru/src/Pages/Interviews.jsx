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
  const [form, setForm] = useState({
    date: "", time: "", duration: "60", interviewType: "Technical", round: "Round 1",
    mode: "Onsite", venue: "Dera Bassi Office", building: "", floorRoom: "",
    platform: "Google Meet", meetingLink: "", meetingId: "", passcode: "",
    interviewer: "", notes: ""
  });

  const fetchVacancies = async () => {
    setLoadingVac(true);
    try {
      const res = await fetch(`${API}/api/vacancies/`);
      const data = await res.json();
      const list = Array.isArray(data)? data : data.recordset || data.data || [];
      setVacancies(list);
      if (list.length &&!selectedId) setSelectedId(list[0].id);
    } catch (e) { setVacancies([]); }
    setLoadingVac(false);
  };

  const fetchApplications = async (vacancyId) => {
    if (!vacancyId) return;
    setLoadingApps(true);
    try {
      const res = await fetch(`${API}/api/vacancies/${vacancyId}/applications`);
      const data = await res.json();
      let list = Array.isArray(data)? data : data.recordset || data.data || data.applications || [];

      console.log("RAW:", list[0]); // debug - isko dekh ke field pata chalega

      const mapped = list.map(a => {
        const appId = a.ApplicationId?? a.applicationId?? a.Id?? a.id;
        const candidateName = a.CandidateName || a.candidateName || a.Name || a.FullName || a.Candidate?.Name || `${a.FirstName || a.first_name || ""} ${a.LastName || a.last_name || ""}`.trim() || `Candidate #${appId}`;
        const email = a.Email || a.email || a.CandidateEmail || a.Candidate?.Email || a.candidate_email || "";
        const phone = a.Phone || a.phone || a.Mobile || a.mobile || a.Candidate?.Phone || "";

        return {
          ApplicationId: appId,
          CandidateId: a.CandidateId || a.candidateId,
          CandidateName: candidateName || "Unknown Candidate",
          Email: email,
          Phone: phone,
          CurrentStage: (a.CurrentStage || a.currentStage || a.stage || "").trim(),
          AppliedAt: a.AppliedAt || a.appliedAt
        };
      }).filter(a => a.CurrentStage === "Interview");

      setApplications(mapped);
    } catch (e) { console.error(e); setApplications([]); }
    setLoadingApps(false);
  };

  useEffect(() => { fetchVacancies(); }, []);
  useEffect(() => { if (selectedId) { fetchApplications(selectedId); setSelected([]); } }, [selectedId]);

  const selectedVacancy = useMemo(() => vacancies.find(v => v.id === selectedId), [vacancies, selectedId]);
  const filteredVac = useMemo(() => vacancies.filter(v => `${v.jobTitle} ${v.id} ${v.location}`.toLowerCase().includes(search.toLowerCase())), [vacancies, search]);
  const filteredApps = useMemo(() => applications.filter(a => `${a.CandidateName} ${a.Email} ${a.ApplicationId}`.toLowerCase().includes(candidateSearch.toLowerCase())), [applications, candidateSearch]);

  const toggle = (id) => setSelected(p => p.includes(id)? p.filter(x => x!== id) : [...p, id]);

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

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (form.mode === "Virtual" &&!form.meetingLink) return alert("Please paste Meeting Link");
    try {
      for (let appId of selected) {
        await fetch(`${API}/api/interviews`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ApplicationId: appId, VacancyId: selectedId,...form, InterviewDate: form.date, InterviewTime: form.time })
        });
      }
      setShowModal(false); fetchApplications(selectedId);
    } catch (err) { alert(err.message); }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime())? "—" : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f6f8] text-zinc-900 antialiased">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#f5f6f8]/80 border-b border-zinc-200/60">
        <div className="mx-auto max-w- px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-black text-white grid place-items-center font-bold text-">In</div>
            <div><h1 className="text- font-semibold tracking-tight">Interviews</h1><p className="text- text-zinc-500">Vacancy pipeline • {vacancies.length} active jobs</p></div>
          </div>
          <button onClick={() => selected.length && setShowModal(true)} disabled={!selected.length} className="h-9 px-5 rounded-full bg-black text-white text- font-medium disabled:opacity-30 hover:bg-zinc-800 transition">Schedule Interview • {selected.length} selected</button>
        </div>
      </div>

      <div className="mx-auto max-w- px-4 md:px-6 py-6 grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded- border border-zinc-200 shadow-sm flex flex-col h-[calc(100vh-110px)] overflow-hidden">
            <div className="p-3.5 border-b border-zinc-100">
              <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, ID, location" className="w-full h-10 bg-zinc-100 rounded-full pl-10 pr-4 text- outline-none focus:bg-white focus:ring-2 focus:ring-black/10 border border-transparent" /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loadingVac? [1,2,3].map(i => <div key={i} className="h- rounded- bg-zinc-100 animate-pulse" />) : filteredVac.map(v => {
                const active = selectedId === v.id;
                return (
                  <button key={v.id} onClick={() => setSelectedId(v.id)} className={`w-full text-left rounded- border p-4 transition-all ${active? "bg-zinc-900 text-white border-zinc-900 shadow-lg" : "bg-white border-zinc-200 hover:border-zinc-300"}`}>
                    <div className="flex justify-between gap-2"><h3 className="font-semibold text- line-clamp-2 leading-tight">{v.jobTitle}</h3><span className={`text- px-2 py-1 rounded-full h-fit font-bold ${active? "bg-white/15" : "bg-zinc-900 text-white"}`}>INT {v.interview}</span></div>
                    <div className={`mt-2 text- flex items-center gap-1 ${active? "text-zinc-400" : "text-zinc-500"}`}><span className={`px-1.5 py-0.5 rounded font-mono text- ${active? "bg-white/10" : "bg-zinc-100"}`}>{v.id}</span>•<span className="truncate">{v.location}</span></div>
                    <div className="mt-3 flex gap-1.5"><span className={`text- px-2 py-1 rounded-full border ${active? "border-white/10 bg-white/5" : "bg-zinc-50 border-zinc-200"}`}>{v.totalCandidates} total</span><span className={`text- px-2 py-1 rounded-full ${active? "bg-white text-black" : "bg-zinc-100"}`}>{v.department || "Engineering"}</span></div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="bg-white rounded- border border-zinc-200 shadow-sm flex flex-col h-[calc(100vh-110px)] overflow-hidden">
            {!selectedVacancy? <div className="flex-1 grid place-items-center text-sm text-zinc-500">Select a vacancy</div> : (
              <>
                <div className="p-5 border-b border-zinc-100">
                  <div className="flex justify-between gap-4 flex-wrap">
                    <div><div className="flex items-center gap-2"><h2 className="text- font-semibold">{selectedVacancy.jobTitle}</h2><span className="text- bg-black text-white px-2.5 py-1 rounded-full font-mono">{selectedVacancy.id}</span><span className="text- bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-bold">INTERVIEW</span></div><p className="text- text-zinc-500 mt-1.5">{selectedVacancy.location} • {formatDate(selectedVacancy.lastAppliedAt || selectedVacancy.createdAt)} • {selectedVacancy.totalCandidates} candidates</p></div>
                    <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span><input value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} placeholder="Search candidate, email, App ID..." className="w- h-10 bg-zinc-100 rounded-full pl-10 pr-4 text- outline-none focus:bg-white focus:ring-2 focus:ring-black/10" /></div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {loadingApps? <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h- rounded-xl bg-zinc-100 animate-pulse" />)}</div> : filteredApps.length === 0? (
                    <div className="h-full grid place-items-center p-10 text-center"><p className="text- font-medium">No candidates in Interview</p><p className="text- text-zinc-500 mt-1">On Hold wale yaha nahi dikhenge</p></div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      <div className="sticky top-0 bg-white/90 backdrop-blur px-5 py-3 flex items-center gap-4 text- font-semibold uppercase tracking-wide text-zinc-400 border-b">
                        <input type="checkbox" checked={selected.length === filteredApps.length && filteredApps.length > 0} onChange={e => setSelected(e.target.checked? filteredApps.map(a => a.ApplicationId) : [])} className="rounded" />
                        <span className="flex-1">Candidate</span><span className="w- hidden md:block">Stage</span><span className="w- text-right">Actions</span>
                      </div>
                      {filteredApps.map(app => (
                        <div key={app.ApplicationId} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors group">
                          <input type="checkbox" checked={selected.includes(app.ApplicationId)} onChange={() => toggle(app.ApplicationId)} className="rounded" />
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center font-bold text- shrink-0">{app.CandidateName[0]?.toUpperCase()}</div>
                            <div className="min-w-0"><div className="font-medium text-[13.5px] truncate">{app.CandidateName}</div><div className="flex items-center gap-2 text- text-zinc-500 truncate"><span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">#{app.ApplicationId}</span><span className="truncate">{app.Email || "no email"}</span>{app.Phone && <><span>•</span><span>{app.Phone}</span></>}</div></div>
                          </div>
                          <div className="w- hidden md:block"><span className="text- px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium inline-flex items-center gap-1"><span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse" />Interview</span></div>
                          <div className="w- flex justify-end gap-1.5">
                            <button onClick={() => { setSelected([app.ApplicationId]); setShowModal(true); }} className="h-8 px-3.5 rounded-full bg-black text-white text- font-medium hover:bg-zinc-800">Schedule</button>
                            <button onClick={() => moveToStage(app.ApplicationId, "On Hold")} className="h-8 px-3 rounded-full bg-white border text- hover:bg-amber-50">Hold</button>
                            <button onClick={() => moveToStage(app.ApplicationId, "Offer")} className="h-8 w-8 rounded-full bg-white border grid place-items-center hover:bg-green-50">↗</button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <form onSubmit={handleSchedule} className="relative bg-white w-full md:max-w- rounded-t- md:rounded- shadow-2xl flex flex-col max-h- overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between"><div><h3 className="font-semibold text-">Schedule Interview</h3><p className="text- text-zinc-500 mt-1">{selected.length} candidates • Vacancy {selectedId}</p></div><button type="button" onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full bg-zinc-100 grid place-items-center">✕</button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="text- font-medium">Date *<input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="mt-1 w-full h-11 border rounded-xl px-3 text-" /></label>
                <label className="text- font-medium">Time *<input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="mt-1 w-full h-11 border rounded-xl px-3 text-" /></label>
              </div>
              <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-full w-fit">
                {["Onsite","Virtual","Telephonic"].map(m => <button key={m} type="button" onClick={() => setForm({...form, mode: m})} className={`px-4 h-8 rounded-full text- font-medium ${form.mode===m?"bg-black text-white":"text-zinc-500"}`}>{m}</button>)}
              </div>
              {form.mode==="Onsite"? (
                <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="Dera Bassi Office - Venue" className="w-full h-11 border rounded-xl px-3 text-" />
              ) : form.mode==="Virtual"? (
                <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border">
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="h-11 border rounded-xl px-3 text- bg-white"><option>Google Meet</option><option>Zoom</option><option>Microsoft Teams</option><option>Other</option></select>
                    <input value={form.meetingId} onChange={e => setForm({...form, meetingId: e.target.value})} placeholder="Meeting ID" className="h-11 border rounded-xl px-3 text- bg-white" />
                  </div>
                  <input required={form.mode==="Virtual"} value={form.meetingLink} onChange={e => setForm({...form, meetingLink: e.target.value})} placeholder="Paste manual meeting link * https://..." className="w-full h-11 border rounded-xl px-3 text- bg-white" />
                  <input value={form.passcode} onChange={e => setForm({...form, passcode: e.target.value})} placeholder="Passcode (optional)" className="w-full h-11 border rounded-xl px-3 text- bg-white" />
                </div>
              ) : (
                <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="Call instructions" className="w-full h-11 border rounded-xl px-3 text-" />
              )}
              <input value={form.interviewer} onChange={e => setForm({...form, interviewer: e.target.value})} placeholder="Interviewer name" className="w-full h-11 border rounded-xl px-3 text-" />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes..." className="w-full min-h- border rounded-xl p-3 text- resize-none" />
            </div>
            <div className="p-4 bg-zinc-50 border-t flex justify-end gap-2"><button type="button" onClick={() => setShowModal(false)} className="h-11 px-5 rounded-full bg-white border text-">Cancel</button><button type="submit" className="h-11 px-6 rounded-full bg-black text-white text- font-medium">Confirm & Send</button></div>
          </form>
        </div>
      )}
    </div>
  );
}