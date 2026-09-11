import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom"; // HATA DIYA - Tab system me iski zarurat nahi, isse error aa raha tha
import {
  Briefcase, MapPin, Building2, IndianRupee, ChevronDown, ChevronUp, Search,
  SlidersHorizontal, GraduationCap, Sparkles, CheckCircle, PlusCircle, Clock,
  Eye, EyeOff, Loader2, Trash2,
  Edit,
  Printer,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

export default function VacancyList({ onCreateNew, onEdit }) {
  // const navigate = useNavigate(); // HATA DIYA
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});

  const handleEdit = (id) => {
    if (onEdit) onEdit(id);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/vacancies`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      console.log("Fetched vacancies:", data);
      setVacancies(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch. Check console. Backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleExpand = async (id) => {
    if (expandedCardId === id) { setExpandedCardId(null); return; }
    setExpandedCardId(id);
    if (!detailsCache[id]) {
      try {
        const res = await fetch(`${API_BASE}/vacancies/${id}`);
        const full = await res.json();
        setDetailsCache((prev) => ({...prev, [id]: full }));
      } catch (err) { console.error(err); }
    }
  };

  // Delete Vacancy 
  const handleDelete = async (id) => {
    if (!window.confirm("Delete vacancy ID " + id + "?")) return;
    await fetch(`${API_BASE}/vacancies/${id}`, { method: "DELETE" });
    setVacancies((prev) => prev.filter((v) => v.id!== id));
  };

  // Filter Vacancy
  const filteredVacancies = vacancies.filter((job) => {
    const matchesSearch = job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === "All" || job.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departments = ["All",...new Set(vacancies.map((v) => v.department))];

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center gap-2 bg-gray-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading from recru DB...</p>
      </div>
    );
  }

  // Handle Print 
const handlePrint = async (id) => {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return alert("Popup blocked");

  try {
    const res = await fetch(`${API_BASE}/vacancies/${id}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const vacancy = await res.json();

    const parseList = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try { const p = JSON.parse(field); return Array.isArray(p)? p : [p]; }
        catch { return field.split(/[,\n]/).map(s => s.trim()).filter(Boolean); }
      }
      return [];
    };

    const responsibilities = parseList(vacancy.responsibilities);
    const skills = parseList(vacancy.skills);
    const qualifications = parseList(vacancy.qualifications);

    const postedDate = vacancy.postedDate || vacancy.CreatedAt
    ? new Date(vacancy.postedDate || vacancy.CreatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN');

    const printedAt = new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const salaryText = vacancy.isSalaryPublic
    ? '₹' + Number(vacancy.minSalary).toLocaleString('en-IN') + ' - ₹' + Number(vacancy.maxSalary).toLocaleString('en-IN') + ' LPA'
      : 'Confidential (Internal: ₹' + Number(vacancy.minSalary).toLocaleString('en-IN') + ' - ₹' + Number(vacancy.maxSalary).toLocaleString('en-IN') + ')';

    // === CHANGE COMPANY DETAILS HERE ===
    const company = {
      name: "Enigma Technologies Pvt. Ltd.",
      tagline: "Innovating Data & Engineering Solutions",
      address: "Industrial Area, Dera Bassi, Punjab - 140507",
      email: "hr@enigmatech.com | careers@enigmatech.com",
      phone: "+91 98765-43210",
      website: "www.enigmatech.com",
      logo: "ET" // Replace with <img src='...' /> if you have logo URL
    };

    printWindow.document.write(`
      <html>
      <head>
        <title>JD - ${vacancy.id} - ${vacancy.jobTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif}
          body{padding:0;color:#1e293b;background:#fff}
         .page{max-width:850px;margin:0 auto;padding:35px 45px}
          /* COMPANY HEADER */
         .company-header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4f46e5;padding-bottom:18px;margin-bottom:20px}
         .company-logo{display:flex;align-items:center;gap:14px}
         .logo-box{width:52px;height:52px;background:#4f46e5;color:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px}
         .company-info h1{font-size:18px;font-weight:800;color:#0f172a}.company-info p{font-size:11px;color:#64748b;margin-top:2px}
         .company-contact{text-align:right;font-size:11px;color:#475569;line-height:1.5}
          /* DOC META */
         .doc-title{text-align:center;margin:18px 0 22px}
         .doc-title h2{font-size:22px;font-weight:800;letter-spacing:0.5px;color:#0f172a;border:none;margin:0}
         .doc-title p{font-size:11px;color:#64748b;margin-top:6px}
         .meta-bar{display:flex;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:11px;color:#334155;margin-bottom:22px}
         .meta-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}
         .meta-box{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px}
         .meta-box.label{font-size:10px;text-transform:uppercase;letter-spacing:0.6px;color:#64748b;font-weight:700}
         .meta-box.value{font-size:13px;font-weight:600;margin-top:4px;color:#0f172a}
         .badge{display:inline-block;background:#dcfce7;color:#166534;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid #bbf7d0}
          h3{font-size:12px;text-transform:uppercase;letter-spacing:0.8px;color:#4f46e5;margin:26px 0 10px;padding-bottom:7px;border-bottom:1px solid #e2e8f0}
         .summary{background:#f8fafc;border-left:4px solid #4f46e5;padding:14px 16px;border-radius:0 10px 10px 0;font-size:13.5px;line-height:1.65;color:#334155}
         .list{list-style:none}.list li{display:flex;gap:10px;margin:10px 0;font-size:13.5px;line-height:1.5}
         .num{background:#4f46e5;color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
         .tags{display:flex;flex-wrap:wrap;gap:7px}.tag{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600}
          /* SIGNATURE */
         .signature-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:45px;padding-top:25px;border-top:1px dashed #cbd5e1}
         .sign-box{text-align:center}.sign-line{border-top:1px solid #0f172a;margin-top:60px;padding-top:8px;font-size:11px;font-weight:600}
         .sign-role{font-size:10px;color:#64748b;font-weight:500;margin-top:2px}
         .footer{margin-top:35px;background:#0f172a;color:#94a3b8;text-align:center;padding:12px;border-radius:8px;font-size:10px;letter-spacing:0.3px}
          @media print{@page{margin:12mm 10mm}.page{padding:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        </style>
      </head>
      <body>
        <div class="page">
          <!-- COMPANY HEADER -->
          <div class="company-header">
            <div class="company-logo">
              <div class="logo-box">${company.logo}</div>
              <div class="company-info">
                <h1>${company.name}</h1>
                <p>${company.tagline}</p>
                <p style="margin-top:4px;font-size:10px">${company.address}</p>
              </div>
            </div>
            <div class="company-contact">
              <div>${company.email}</div>
              <div>${company.phone}</div>
              <div style="color:#4f46e5;font-weight:600">${company.website}</div>
            </div>
          </div>

          <div class="doc-title">
            <h2>JOB DESCRIPTION - VAC-${vacancy.id}</h2>
            <p>Ref: ${vacancy.id} | Status: <span class="badge">${vacancy.status}</span> | Posted: ${postedDate}</p>
          </div>

          <div class="meta-bar">
            <div><b>Document ID:</b> JD-${vacancy.id}</div>
            <div><b>Printed At:</b> ${printedAt}</div>
            <div><b>Printed By:</b> HR Department / System</div>
          </div>

          <div class="meta-grid">
            <div class="meta-box"><div class="label">Job Title</div><div class="value">${(vacancy.jobTitle || '').trim()}</div></div>
            <div class="meta-box"><div class="label">Department</div><div class="value">${vacancy.department || '-'}</div></div>
            <div class="meta-box"><div class="label">Employment Type</div><div class="value">${vacancy.employmentType || '-'} • ${vacancy.workspace || ''}</div></div>
            <div class="meta-box"><div class="label">Location</div><div class="value">${vacancy.location || '-'}</div></div>
            <div class="meta-box"><div class="label">Experience Level</div><div class="value">${vacancy.experienceLevel || '-'}</div></div>
            <div class="meta-box"><div class="label">Compensation</div><div class="value" style="font-size:12px">${salaryText}</div></div>
          </div>

          <h3>1. Job Summary / Objective</h3>
          <div class="summary">${vacancy.jobSummary || 'N/A'}</div>

          <h3>2. Key Responsibilities & Duties</h3>
          <ul class="list">
            ${responsibilities.length? responsibilities.map((r,i)=>'<li><div class="num">'+String(i+1).padStart(2,'0')+'</div><div>'+String(r).trim()+'</div></li>').join('') : '<li>No responsibilities defined</li>'}
          </ul>

          <h3>3. Required Technical Skills</h3>
          <div class="tags">${skills.length? skills.map(s=>'<span class="tag">'+String(s).trim()+'</span>').join('') : 'No skills defined'}</div>

          <h3>4. Qualifications & Education</h3>
          <ul class="list">${qualifications.map(q=>'<li><div class="num">✓</div><div>'+String(q).trim()+'</div></li>').join('')}</ul>

          <h3>5. Additional Information</h3>
          <div style="font-size:12px;line-height:1.6;color:#475569;background:#fffbeb;border:1px solid #fde68a;padding:12px;border-radius:8px">
            This job description is confidential and intended for internal recruitment purposes. Salary is ${vacancy.isSalaryPublic? 'public' : 'confidential and not to be disclosed outside HR'}.
            Candidate must be willing to work ${vacancy.workspace} from ${vacancy.location}.
          </div>

          <!-- SIGNATURE SECTION -->
          <div class="signature-grid">
            <div class="sign-box"><div class="sign-line">Hiring Manager</div><div class="sign-role">${vacancy.department} Department</div><div class="sign-role">Date: ___________</div></div>
            <div class="sign-box"><div class="sign-line">HR Manager</div><div class="sign-role">Human Resources</div><div class="sign-role">Date: ___________</div></div>
            <div class="sign-box"><div class="sign-line">Authorized Signatory</div><div class="sign-role">For ${company.name}</div><div class="sign-role">Date: ___________</div></div>
          </div>

          <div class="footer">
            This is a system generated document | Printed At: ${printedAt} | VAC-${vacancy.id} | ${company.name} © ${new Date().getFullYear()} | Page 1 of 1 | www.enigmatech.com
          </div>
        </div>
        <script>window.onload=function(){window.print(); window.onafterprint=function(){window.close();}}<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error(err);
    printWindow.close();
    alert("Failed to fetch vacancy detail");
  }
};
  return (
    <div className="w-full bg-gray-50/50 p-4 sm:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by job title, location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="bg-transparent border-none text-xs font-medium text-gray-700 focus:outline-none cursor-pointer">
              {departments.map((dept) => (<option key={dept} value={dept}>{dept === "All"? "All Departments" : dept}</option>))}
            </select>
          </div>
          <button onClick={fetchAll} className="px-3 py-2 rounded-lg border text-xs">Refresh</button>
          {onCreateNew && (<button onClick={onCreateNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"><PlusCircle className="h-4 w-4" /> Create</button>)}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Total: {vacancies.length} | 
        Active: {vacancies.filter(v => v.status === 'Active').length} | 
        Published: {vacancies.filter(v => v.status === 'Published').length} | 
        Filled: {vacancies.filter(v => v.status === 'Filled').length} | 
        Closed: {vacancies.filter(v => v.status === 'Closed').length}
      </div>

      <div className="space-y-4">
        {filteredVacancies.length === 0? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No vacancies found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{vacancies.length === 0? "Database is empty. Create your first vacancy from the form." : "No match for your search."}</p>
          </div>
        ) : (
          filteredVacancies.map((vacancy) => {
            const isExpanded = expandedCardId === vacancy.id;
            const full = detailsCache[vacancy.id] || vacancy;
            const postedDate = vacancy.postedDate? new Date(vacancy.postedDate).toLocaleDateString() : "";
            return (
              <div key={vacancy.id} className="bg-white border border-gray-200 rounded-xl shadow-xs hover:border-gray-300 overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{vacancy.jobTitle}</h2>
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border${vacancy.status === 'Closed' ? 'bg-red-50 text-red-700 border-red-200' : ''}${['Active','Published'].includes(vacancy.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}${vacancy.status === 'Filled' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}${vacancy.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}`}>{vacancy.status} • {vacancy.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1 font-medium text-gray-700"><Building2 className="h-3.5 w-3.5 text-gray-400" />{vacancy.department}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" />{vacancy.location}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">{vacancy.workspace}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">{vacancy.employmentType}</span>
                        <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3.5 w-3.5" />{postedDate}</span>
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      <div className="text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-1 text-base font-bold text-gray-900"><IndianRupee className="h-4 w-4 text-emerald-600" /><span>{vacancy.minSalary?.toLocaleString("en-IN")} - {vacancy.maxSalary?.toLocaleString("en-IN")}</span></div>
                        <div className="flex items-center gap-1 text- text-gray-400">{vacancy.isSalaryPublic? <><Eye className="h-3 w-3" /> Public</> : <><EyeOff className="h-3 w-3 text-amber-500" /> Internal</>}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handlePrint(vacancy.id)} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer"><Printer className="h-4 w-4"></Printer></button>
                        <button onClick={() => handleEdit(vacancy.id)} className="p-1.5 text-gray-600 hover:text-green-900 hover:bg-green-50 rounded-lg cursor-pointer"><Edit className="h-4 w-4"/></button>
                        <button onClick={() => handleDelete(vacancy.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                        <button onClick={() => toggleExpand(vacancy.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer">{isExpanded? <>Less Details <ChevronUp className="h-4 w-4" /></> : <>View Details <ChevronDown className="h-4 w-4" /></>}</button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">{vacancy.jobSummary}</p>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-5 sm:p-6 space-y-6">
                    {!detailsCache[vacancy.id]? (<div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading full details from DB...</div>) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-gray-200/60">
                          <div><span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Experience Level</span><span className="text-sm font-medium text-gray-900 mt-1 block">{full.experienceLevel}</span></div>
                          <div className="md:col-span-3"><span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Detailed Purpose & Summary</span><p className="text-xs text-gray-700 mt-1 leading-relaxed">{full.jobSummary}</p></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="bg-white p-4 rounded-lg border border-gray-200"><div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3"><CheckCircle className="h-4 w-4 text-blue-600" /> Responsibilities</div><ul className="space-y-2">{(full.responsibilities || []).map((resp, i) => (<li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-snug"><span className="text-blue-500 font-bold">•</span><span>{resp}</span></li>))}</ul></div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200"><div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3"><GraduationCap className="h-4 w-4 text-blue-600" /> Qualifications</div><ul className="space-y-2">{(full.qualifications || []).map((qual, i) => (<li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-snug"><span className="text-purple-500 font-bold">•</span><span>{qual}</span></li>))}</ul></div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200"><div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3"><Sparkles className="h-4 w-4 text-blue-600" /> Required Skills</div><div className="flex flex-wrap gap-1.5">{(full.skills || []).map((skill, i) => (<span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">{skill}</span>))}</div></div>
                        </div>
                      </>
                    )}
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