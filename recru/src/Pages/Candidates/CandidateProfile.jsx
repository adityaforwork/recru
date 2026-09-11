import React, { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Building } from "lucide-react";

export default function CandidateProfile({ candidateId, onBack, onEdit }) {
  const [candidate, setCandidate] = useState(null);
  const [raw, setRaw] = useState(null);

  useEffect(() => {
    if (!candidateId) return;
    console.log("Fetching ID:", candidateId);
    fetch(`http://localhost:5000/api/candidates/${candidateId}`)
     .then(r => r.json())
     .then(data => {
        console.log("RAW API RESPONSE:", data);
        setRaw(JSON.stringify(data, null, 2));
        const final = Array.isArray(data)? data[0] : data;
        setCandidate(final);
      })
     .catch(err => console.error(err));
  }, [candidateId]);

  if (!candidate) return <div className="p-10">Loading ID {candidateId}... <pre className="mt-4 text-xs bg-gray-100 p-2">{raw}</pre></div>;

  return (
    <div className="w-full p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-4 border px-3 py-1.5 rounded-lg hover:bg-gray-50">
        <ArrowLeft size={16}/> Back to Candidates
      </button>

      <div className="bg-white border-2 rounded-2xl p-8">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">{candidate.first_name} {candidate.last_name}</h1>
            <p className="text-gray-600 text-lg mt-1">{candidate.applied_role}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Mail size={14}/> {candidate.email || "—"}</span>
              <span className="flex items-center gap-1"><Phone size={14}/> {candidate.phone || "—"}</span>
              <span className="flex items-center gap-1"><MapPin size={14}/> {candidate.current_location || "—"}</span>
              <span className="flex items-center gap-1"><Building size={14}/> {candidate.current_employer || "—"}</span>
            </div>
          </div>
          <button onClick={() => onEdit(candidate.id)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm h-fit">Edit Profile</button>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t">
          <div><p className="text-xs text-gray-400 uppercase tracking-wider">Experience</p><p className="font-semibold mt-1">{candidate.experience_years?? "0"} Years</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider">Current CTC</p><p className="font-semibold mt-1">₹ {candidate.current_ctc?? "—"}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider">Expected CTC</p><p className="font-semibold mt-1">₹ {candidate.expected_ctc?? "—"}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider">Notice Period</p><p className="font-semibold mt-1">{candidate.notice_period || "—"}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wider">Skills</p><p className="font-semibold mt-1">{candidate.skills || "No skills added"}</p></div>
        </div>
      </div>

      {/* DEBUG - isko data dikhne ke baad hata dena */}
      {/* <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-gray-400">Show Raw JSON (debug)</summary>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg mt-2 overflow-auto">{raw}</pre>
      </details> */}
    </div>
  );
}