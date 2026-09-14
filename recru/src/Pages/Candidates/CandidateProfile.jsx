import React, { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Building, Link2, GraduationCap, Briefcase, IndianRupee, Clock, FileText, ExternalLink, Download, Calendar, Globe, User, Hash, Layers, ReceiptPoundSterling, FileUser } from "lucide-react";
import PdfFirstPagePreview from "../../Components/PdfFirstPagePreview";
const formatCTC = (val) => {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '—';
  return `₹ ${Number(val).toLocaleString("en-IN")}`;
};

export default function CandidateProfile({ candidateId, onBack, onEdit }) {
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    if (!candidateId) return;
    fetch(`http://localhost:5000/api/candidates/${candidateId}`)
      .then(r => r.json())
      .then(data => {
        // tumhara API array deta hai [{"id":"1029"...}] isliye array check
        const final = Array.isArray(data) ? data[0] : data;
        setCandidate(final);
      });
  }, [candidateId]);

  if (!candidate) return <div className="p-10 text-sm">Loading ID {candidateId}...</div>;

  // tumhare reference JSON se
  const resumeUrl = candidate.resume_path ? `http://localhost:5000/${candidate.resume_path}` : null;
  const skillsList = candidate.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="w-full p-6 bg-gray-50/50 min-h-screen">
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-5 border px-3.5 py-2 rounded-full bg-white">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* Main Column Container for Candidate Profiles */}
        <div className="col-span-12 lg:col-span-8">

          {/* Profile Overview Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-7 shadow-sm">
            <div className="flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap">

              {/* Candidate Avatar and Roles information */}
              <div className="flex gap-4 items-start">
                {/* Dynamic Gradient Monogram Initials Icon */}
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white grid place-items-center font-bold text-sm shrink-0 shadow-sm">
                  {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                </div>

                <div>
                  <h1 className="text-base font-bold text-zinc-900 leading-tight">
                    {candidate.first_name} {candidate.last_name}
                  </h1>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1.5 font-medium">
                    <Briefcase size={13} className="text-zinc-400" /> {candidate.applied_role}
                  </p>

                  {/* Dynamic Badge Meta Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${candidate.currentStage === 'Screening'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                      }`}>
                      {(candidate.currentStage || 'Not Applied').toUpperCase()}
                    </span>
                    {candidate.lastJobTitle && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-50 border border-amber-200 text-amber-700 font-bold tracking-wider">
                        {candidate.lastJobTitle.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Trigger Action Button */}
              <button
                onClick={() => onEdit(candidate.id)}
                className="px-4 py-2 bg-emerald-950 text-emerald-50 hover:bg-emerald-900 transition-all text-xs font-semibold rounded-full shadow-sm active:scale-[0.98]"
              >
                Edit Profile
              </button>
            </div>

            {/* Financial & Professional Information Grid: Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Experience</p>
                <p className="font-bold text-zinc-800 text-sm mt-1">{candidate.experience_years ?? '0'} Years</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{candidate.current_employer || 'No company'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Current CTC</p>
                <p className="font-bold text-zinc-800 text-sm mt-1">{formatCTC(candidate.current_ctc)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Expected CTC</p>
                <p className="font-bold text-emerald-700 text-sm mt-1">{formatCTC(candidate.expected_ctc)}</p>
              </div>
            </div>

            {/* Operational Meta Metrics Grid: Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-100/70">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Notice Period</p>
                <p className="text-xs font-medium text-zinc-700 mt-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-zinc-400" /> {candidate.notice_period}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Source</p>
                <p className="text-xs font-medium text-zinc-700 mt-1.5">{candidate.application_source || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Total Applications</p>
                <p className="text-xs font-medium text-zinc-700 mt-1.5 flex items-center gap-1.5">
                  <Layers size={13} className="text-zinc-400" /> {candidate.totalApplications || 0}
                </p>
              </div>
            </div>

            {/* Tagged Technical Skills Inventory */}
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2.5">
                Skills Required • <span className="text-zinc-700 font-mono font-bold">{skillsList.length}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.length ? (
                  skillsList.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200/50 hover:bg-zinc-200 transition-colors">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400 italic">— No explicit skills indexed</span>
                )}
              </div>
            </div>
          </div>

          {/* Document Repository & Interactive Compact Preview Block */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 mt-6 shadow-sm">
            {/* Primary Header Section */}
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <FileText size={15} className="text-emerald-700" /> Candidate Document Repository
            </h3>

            {resumeUrl ? (
              <div className="mt-4 space-y-4">
                {/* Informative Sub-heading to notify the user about file accessibility */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
                    Resume Document Available For Preview
                  </p>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5 pl-3.5">
                    Review the first-page structural overview layout snapshot directly below.
                  </p>
                </div>

                {/* WhatsApp/Chat Style Single Page Preview Card Frame */}
                <div className="relative group border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 shadow-sm max-w-md mx-auto sm:mx-0">

                  {/* Conceptual Visual Document Snapshot Body */}
                  <PdfFirstPagePreview url={resumeUrl} />

                  {/* Dynamic Media Context Footer bar */}
                  <div className="bg-zinc-100 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] tracking-wider shrink-0">
                        <FileUser />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-700 truncate">
                          {candidate.first_name || 'Candidate'}_Resume.pdf
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          Page 1 of 1 • Preview Snapshot
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Quick-action Utility Control Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full bg-emerald-950 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-900 transition-colors shadow-sm active:scale-[0.98]"
                  >
                    <ExternalLink size={13} /> View Fullscreen
                  </a>
                  <a
                    href={resumeUrl}
                    download
                    className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-zinc-50 transition-colors active:scale-[0.98]"
                  >
                    <Download size={13} /> Download PDF
                  </a>
                </div>
              </div>
            ) : (
              // Inline Fallback UI state for Missing Document URL
              <div className="mt-4 p-8 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/40">
                <p className="text-xs font-medium text-zinc-500">No active resume uploaded for {candidate.first_name}</p>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  System ID: {candidate.id} • Registered: {new Date(candidate.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>


        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">

            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contact & Links</p>

            <div className="mt-5 space-y-3.5 text-sm text-zinc-600">

              {/* Email - Clickable */}
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-3 hover:text-zinc-900 transition-colors duration-200 group"
              >
                <Mail size={16} className="text-zinc-400 group-hover:text-zinc-900" />
                <span className="underline-offset-2 group-hover:underline">{candidate.email}</span>
              </a>

              {/* Phone - Clickable */}
              <a
                href={`tel:${candidate.phone}`}
                className="flex items-center gap-3 hover:text-zinc-900 transition-colors duration-200 group"
              >
                <Phone size={16} className="text-zinc-400 group-hover:text-zinc-900" />
                <span className="underline-offset-2 group-hover:underline">{candidate.phone}</span>
              </a>

              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-zinc-400" />
                <span>{candidate.current_location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Hash size={16} className="text-zinc-400" />
                <span>Candidate ID: {candidate.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-zinc-400" />
                <span>Joined: {new Date(candidate.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 space-y-2.5 bg-zinc-50/50 -mx-6 -mb-6 p-6 rounded-b-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Last Application</span>
                <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                  #{candidate.lastApplicationId}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Last Vacancy</span>
                <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                  VAC-{candidate.lastVacancyId}
                </span>
              </div>
              <div className="flex justify-between items-start text-sm pt-0.5">
                <span className="text-zinc-500 font-medium shrink-0">Last Job Title</span>
                <span className="font-semibold text-zinc-800 text-right max-w-[60%] truncate">
                  {candidate.lastJobTitle || '—'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}