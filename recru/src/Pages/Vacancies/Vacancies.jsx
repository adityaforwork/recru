import React, { useState } from "react";
import { ListFilter, PlusCircle, Briefcase, ArrowLeft } from "lucide-react";
import VacancyList from "./VacancyList";
import CreateVacancyForm from "./CreateVacancyForm";

export default function Vacancies() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="w-full flex flex-col min-h-full">
      {/* Top Navigation / Action Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
        {/* Page Title & Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === "list" ? "Job Vacancies" : "Create New Vacancy"}
            </h1>
            <p className="text-xs text-gray-500">
              {activeTab === "list"
                ? "Manage, filter, and track all job openings across departments."
                : "Fill in role specifications, criteria, and package details."}
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === "list" ? (
            <button
              onClick={() => setActiveTab("create")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Post New Vacancy
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("list")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Vacancy List
            </button>
          )}

          {/* Segmented Pill Navigation Tab (Optional Quick-Switch) */}
          <div className="hidden lg:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "list"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              All Jobs
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "create"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Job
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {activeTab === "list" && (
          <VacancyList onCreateNew={() => setActiveTab("create")} />
        )}

        {activeTab === "create" && (
          <CreateVacancyForm onSuccess={() => setActiveTab("list")} />
        )}
      </div>
    </div>
  );
}
