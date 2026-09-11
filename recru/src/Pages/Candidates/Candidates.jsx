import React, { useState } from "react";
import CandidateList from "./CandidateList";
import AddCandidateForm from "./CreateCandidate";
import CandidateProfile from "./CandidateProfile"; // naya page

export default function Candidates() {
  const [activeView, setActiveView] = useState("list"); // 'list' | 'create' | 'edit' | 'profile'
  const [selectedId, setSelectedId] = useState(null);

  const handleEdit = (id) => {
    setSelectedId(id);
    setActiveView("edit");
  };

  const handleProfile = (id) => {
    setSelectedId(id);
    setActiveView("profile");
  };

  return (
    <div className="w-full flex-1">
      {activeView === "list" && (
        <CandidateList
          onAddNewCandidate={() => {
            setSelectedId(null);
            setActiveView("create");
          }}
          onEdit={handleEdit}
          onViewProfile={handleProfile}
        />
      )}

      {(activeView === "create" || activeView === "edit") && (
        <AddCandidateForm
          candidateId={activeView === "edit"? selectedId : null}
          onSuccess={() => {
            setSelectedId(null);
            setActiveView("list");
          }}
          onCancel={() => {
            setSelectedId(null);
            setActiveView("list");
          }}
        />
      )}
      {activeView === "profile" && (
        <CandidateProfile 
          candidateId={selectedId} 
          onBack={() => { setSelectedId(null); setActiveView("list"); }} 
          onEdit={(id) => { setSelectedId(id); setActiveView("edit"); }} 
        />
      )}
    </div>
  );
}