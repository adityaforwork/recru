import React, { useState } from "react";
import { PlusCircle, Briefcase, ArrowLeft } from "lucide-react";
import VacancyList from "./VacancyList";
import CreateVacancyForm from "./CreateVacancyForm";

export default function Vacancies() {
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState(null);

  const handleCreate = () => {
    setEditingId(null);
    setActiveTab("create");
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setActiveTab("edit");
  };

  const handleBack = () => {
    setEditingId(null);
    setActiveTab("list");
  };

  return (
    <div className="w-full flex flex-col min-h-full">
      {/* Top Navigation / Action Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === "list" ? "Job Vacancies" : activeTab === "edit" ? "Edit Vacancy" : "Create New Vacancy"}
            </h1>
            <p className="text-xs text-gray-500">
              {activeTab === "list"
                ? "Manage, filter, and track all job openings."
                : activeTab === "edit" ? `Editing vacancy ID: ${editingId}` : "Fill in role specifications."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === "list" ? (
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Post New Vacancy
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Vacancy List
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {activeTab === "list" && (
          <VacancyList onCreateNew={handleCreate} onEdit={handleEdit} />
        )}

        {activeTab === "create" && (
          <CreateVacancyForm onSuccess={handleBack} />
        )}

        {activeTab === "edit" && (
          <CreateVacancyForm vacancyIdProp={editingId} onSuccess={handleBack} />
        )}
      </div>
    </div>
  );
}