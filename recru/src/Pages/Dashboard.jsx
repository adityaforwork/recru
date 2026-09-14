import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2, Briefcase, Users, UserCheck, CalendarCheck, TrendingUp, Building2, Clock } from "lucide-react";

const API_BASE = "http://localhost:5000/api";
const STAGES = ['Applied','Screening','Interview','Offer','Hired','Rejected','On Hold'];
// function greetings - 
function greetings(){
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('Screening');
  const getGreetings = greetings()
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE}/dashboard`);
        const json = await res.json();
        setData(json);
        // Auto active stage jisme sabse zyada ho
        if(json.pipeline?.length){
          const max = [...json.pipeline].sort((a,b)=>b.count-a.count)[0];
          if(max.count > 0) setActiveStage(max.stage);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return <main className="flex-1 bg-[#f8fafc] p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /> <span className="ml-2 text-sm">Loading dashboard...</span></main>
  }

  const stats = data?.stats || {};
  const pipeline = data?.pipeline || STAGES.map(s=>({stage:s,count:0}));

  const statCards = [
    { label: "Open Jobs", value: stats.openJobs, sub: `${stats.totalVacancies} total`, icon: Briefcase, color: "bg-blue-600", light: "bg-blue-50 text-blue-600" },
    { label: "Total Candidates", value: stats.totalCandidates, sub: `${stats.totalApplications} applications`, icon: Users, color: "bg-violet-600", light: "bg-violet-50 text-violet-600" },
    { label: "In Interview", value: stats.interviews, sub: `${stats.screening} in screening`, icon: CalendarCheck, color: "bg-amber-500", light: "bg-amber-50 text-amber-600" },
    { label: "Hired", value: stats.hired, sub: "This month", icon: UserCheck, color: "bg-emerald-600", light: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <main className="flex-1 bg-[#f8fafc] p-6 lg:p-8 space-y-6 overflow-y-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text- font-bold tracking-tight text-gray-900">{getGreetings}, Aditya 👋</h1>
          <p className="text- text-gray-500 mt-1">Here's what's happening with your hiring pipeline today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5"/> {new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'short'})}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all group">
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.light}`}><s.icon className="w-5 h-5"/></div>
              <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors"/>
            </div>
            <p className="text- font-semibold tracking-widest text-gray-400 uppercase mt-4">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text- font-bold text-gray-900">Recruitment Pipeline</h2>
          <span className="text-xs bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-gray-600">{pipeline.reduce((a,b)=>a+b.count,0)} total in pipeline</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pipeline.map((p, idx) => {
            const isActive = activeStage === p.stage;
            const isRejected = p.stage === 'Rejected';
            const isOnHold = p.stage === 'On Hold';
            const isHired = p.stage === 'Hired';
            return (
              <React.Fragment key={p.stage}>
                <button onClick={()=>setActiveStage(p.stage)}
                  className={`cursor-pointer relative px-4 py-2 rounded-full font-medium border transition-all flex items-center gap-2
                  ${isActive? 'bg-green-900 text-white border-green-950 shadow-lg shadow-green-50'
                  : isHired? 'bg-green-600 text-white border-green-600 hover:bg-green-50 hover:text-black'
                  : isRejected? 'bg-red-950 text-white border-red-900 hover:bg-red-50 hover:text-black'
                  : isOnHold? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                  {p.stage}
                  <span className={`min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text- font-bold ${isActive? 'bg-white text-black' : 'bg-gray-100 text-gray-700 border'}`}>{p.count}</span>
                </button>
                {idx < 4 && <ArrowRight className="h-3.5 w-3.5 text-gray-300" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text- font-bold text-gray-900">Recent Applications • {activeStage}</h2>
            <span className="text-xs text-blue-600 font-medium cursor-pointer">View all</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-">
              <thead className="bg-gray-50/80 text- tracking-widest text-gray-400 uppercase"><tr><th className="py-3 px-5 font-semibold">Candidate</th><th className="py-3 px-5 font-semibold">Position</th><th className="py-3 px-5 font-semibold">Status</th><th className="py-3 px-5 font-semibold">Date</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.recentApplications || []).filter(r=> activeStage? r.stage === activeStage : true).slice(0,5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80">
                    <td className="py-3.5 px-5 font-medium text-gray-900">{row.candidateName}</td>
                    <td className="py-3.5 px-5 text-gray-600">{row.jobTitle}</td>
                    <td className="py-3.5 px-5"><span className={`inline-flex px-2.5 py-1 rounded-full text- font-medium border ${row.stage==='Interview'?'bg-purple-50 text-purple-700 border-purple-200':row.stage==='Hired'?'bg-green-50 text-green-700 border-green-200':row.stage==='Rejected'?'bg-red-50 text-red-700 border-red-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{row.stage}</span></td>
                    <td className="py-3.5 px-5 text-gray-500">{row.appliedAt? new Date(row.appliedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {(!data?.recentApplications || data.recentApplications.length===0) && <tr><td colSpan="4" className="py-10 text-center text-gray-400">No applications in {activeStage}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department + Recent Vacancies */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text- font-bold flex items-center gap-2"><Building2 className="w-4 h-4"/> Department Wise</h2>
            <div className="mt-4 space-y-3">
              {(data?.departmentWise || []).map(d=>(
                <div key={d.name} className="flex justify-between items-center"><span className="text- text-gray-600">{d.name}</span><div className="flex items-center gap-2"><div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{width:`${Math.min(d.value*20,100)}%`}}></div></div><span className="text-xs font-bold">{d.value}</span></div></div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text- font-bold">Open Vacancies</h2>
            <div className="mt-4 space-y-3">
              {(data?.recentVacancies || []).map(v=>(
                <div key={v.id} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-gray-50 border-transparent hover:border-gray-200 transition-colors"><div><p className="text- font-medium text-gray-900">{v.title}</p><p className="text- text-gray-500">{v.department} • {v.applicants} applicants</p></div><span className={`text- px-2 py-1 rounded-full border border-gray-200 ${v.status==='Published'?'bg-green-50 text-green-700 border-green-200':'bg-gray-50 text-gray-600'}`}>{v.status}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}