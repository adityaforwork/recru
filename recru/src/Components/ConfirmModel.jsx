import React from "react";

export default function ConfirmModal({ open, title, onOk, onCancel, showCancel = true, okText = "OK", cancelText="Cancel" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-green-950 to-emerald-950 text-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-green-800/40">
        <h3 className="text-lg font-medium mt-1 mb-6 leading-relaxed whitespace-pre-line text-green-50">
          {title}
        </h3>
        <div className="flex justify-end gap-3 pt-2 border-t border-green-900/30">
          {showCancel && (
            <button onClick={onCancel} className="px-5 py-2 text-sm rounded-full border border-green-700/60 text-green-200 hover:bg-green-900/40">
              {cancelText}
            </button>
          )}
          <button onClick={onOk} className="px-6 py-2 text-sm rounded-full bg-white text-green-950 font-semibold">
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}