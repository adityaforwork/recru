import React, { useState } from "react";
import CandidateList from "./CandidateList";
import AddCandidateForm from "./CreateCandidate";

export default function Candidates() {
  const [activeView, setActiveView] = useState("list"); // 'list' | 'create'

  return (
    <div className="w-full flex-1">
      {activeView === "list" ? (
        <CandidateList onAddNewCandidate={() => setActiveView("create")} />
      ) : (
        <AddCandidateForm
          onSuccess={() => setActiveView("list")}
          onCancel={() => setActiveView("list")}
        />
      )}
    </div>
  );
}
