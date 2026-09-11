import React, { useState } from "react";
import {
  UploadCloud,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function BulkUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setError("");
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError("Please select a valid Excel or CSV file (.xlsx,.xls,.csv)");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setError("The uploaded sheet is empty.");
          return;
        }

        const formattedCandidates = json.map((row, index) => ({
          id: Date.now() + index,
          firstName: row["First Name"] || row["firstName"] || "",
          lastName: row["Last Name"] || row["lastName"] || "",
          email: row["Email"] || row["email"] || "",
          phone: row["Phone"] || row["phone"] || "",
          currentCity: row["City"] || row["currentCity"] || "",
          appliedRole: row["Applied Role"] || row["appliedRole"] || "",
          currentCompany:
            row["Current Employer"] || row["currentCompany"] || "N/A",
          experienceYears:
            row["Experience (Years)"] || row["experienceYears"] || 0,
          currentSalary: row["Current CTC"] || row["currentSalary"] || 0,
          expectedSalary: row["Expected CTC"] || row["expectedSalary"] || 0,
          noticePeriod:
            row["Notice Period"] || row["noticePeriod"] || "Immediate",
          source: row["Source"] || row["source"] || "Excel Bulk Upload",
          skills: row["Skills"]
           ? String(row["Skills"]).split(",").map((s) => s.trim())
            : [],
          status: "Screening",
          appliedDate: "Today",
        }));

        setPreviewData(formattedCandidates);
      } catch (err) {
        setError("Error parsing file. Columns must match template.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // --- YAHI MAIN CHANGE HAI -> AB DB ME JAYEGA ---
  const handleConfirmUpload = async () => {
    if (previewData.length === 0) {
      setError("No valid candidate records to import.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/candidates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewData),
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message); // "5 candidates imported"
        onClose();
        window.location.reload(); // List ko DB se refresh karo
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Server not running on port 5000. Please check server.js");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">
              Bulk Upload Candidates (Excel)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition-all text-center">
            <UploadCloud className="h-10 w-10 text-blue-600 mb-2" />
            <span className="text-sm font-semibold text-gray-700">
              {file? file.name : "Click to select or drag your Excel file"}
            </span>
            <span className="text-xs text-gray-400 mt-1">Accepts.xlsx,.xls,.csv</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Parsed Preview ({previewData.length} records)
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> Ready to Import
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 text-xs">
                {previewData.slice(0, 5).map((cand, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-semibold text-gray-900">{cand.firstName} {cand.lastName}</p>
                      <p className="text-gray-500">{cand.email} • {cand.phone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                      {cand.appliedRole || "Unspecified Role"}
                    </span>
                  </div>
                ))}
              </div>
              {previewData.length > 5 && (
                <p className="text- text-gray-400 text-center">+ {previewData.length - 5} more records will be imported</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmUpload}
            disabled={previewData.length === 0 || uploading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs inline-flex items-center gap-2"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading? "Saving to DB..." : `Import ${previewData.length} Candidates`}
          </button>
        </div>
      </div>
    </div>
  );
}