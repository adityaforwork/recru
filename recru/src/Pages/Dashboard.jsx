import React from "react";
import { ArrowRight } from "lucide-react";

const stats = [
  { label: "Open Jobs", value: 12 },
  { label: "Candidates", value: 486 },
  { label: "Interviews", value: 18 },
];

const pipelineStages = ["Applied", "Screening", "Interview", "Offer", "Hired"];

const recentApplications = [
  {
    candidate: "Rahul",
    position: "Software",
    status: "Interview",
    date: "Aug 29",
  },
  {
    candidate: "Priya",
    position: "HR Exec",
    status: "Screening",
    date: "Aug 28",
  },
];

export default function Dashboard() {
  return (
    <main className="flex-1 bg-gray-50/50 p-8 space-y-8 overflow-y-auto">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Good Morning, Aditya <span className="text-2xl">👋</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening with recruitment.
        </p>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-all"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recruitment Pipeline Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Recruitment Pipeline
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {pipelineStages.map((stage, index) => (
            <React.Fragment key={stage}>
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  index === 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {stage}
              </div>
              {index < pipelineStages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Applications
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="py-3.5 px-6 font-semibold">Candidate</th>
                <th className="py-3.5 px-6 font-semibold">Position</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentApplications.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-medium text-gray-900">
                    {row.candidate}
                  </td>
                  <td className="py-3.5 px-6 text-gray-600">{row.position}</td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === "Interview"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-gray-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
