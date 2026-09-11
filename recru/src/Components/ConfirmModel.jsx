import React from "react";

export default function ConfirmModal({ open, title, onOk, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f1f1f] text-white rounded-2xl p-6 w- shadow-2xl border border-gray-700">
        <p className="text-sm text-gray-300">localhost:5173 says</p>
        <h3 className="text-lg font-medium mt-2 mb-6">{title || "2 delete kare?"}</h3>

        <div className="flex justify-end gap-3">
          <button
            onClick={onOk}
            className="px-6 py-2 rounded-full bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 font-medium"
          >
            OK
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-full bg-[#3a3a3a] text-white hover:bg-[#4a4a4a] font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}