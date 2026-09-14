import React, { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Briefcase, Users, GitMerge, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setSelected(0);
      } catch { }
      setLoading(false);
    }, 250);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (item) => {
    if (item.type === 'vacancy') navigate(`/vacancies/${item.navId}`);
    if (item.type === 'candidate') navigate(`/candidates?highlight=${item.navId}`);
    if (item.type === 'application') navigate(`/applications?job=${item.navId}`);
  };

  // Keyboard navigation
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) handleSelect(results[selected]);
  };

  const highlight = (text) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <span key={i} className="bg-yellow-200 font-bold">{p}</span> : p);
  };

  const Icon = (type) => type === 'vacancy' ? Briefcase : type === 'candidate' ? Users : GitMerge;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 bg-slate-50/50 rounded-3xl border border-slate-100/80 shadow-sm backdrop-blur-xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            Global Intelligence Search
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Instantly locate vacancies, active candidates, pipelines, and records across the platform.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/60 rounded-lg text-slate-500 font-mono text-[11px] font-bold shadow-inner">
          <span>ESC</span><span className="font-sans text-[10px] text-slate-400">TO CLOSE</span>
        </div>
      </div>

      {/* Search Bar Capsule */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[6px] -z-10" />
        <div className="relative flex items-center bg-white border border-slate-200/80 group-focus-within:border-transparent rounded-2xl shadow-md group-focus-within:shadow-indigo-100 transition-all duration-300">
          <SearchIcon className="absolute left-5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            ref={inputRef}
            autoFocus
            onKeyDown={onKeyDown}
            type="text"
            placeholder="Try 'SQL Developer', 'Aniket', 'Screening'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-14 pr-24 py-4.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {loading ? (
            <div className="absolute right-5 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Searching</span>
            </div>
          ) : (
            <div className="absolute right-5 hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-300 font-mono bg-slate-50 px-2 py-1 rounded-md border">
              <span>⌘</span><span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Grouped Results Grid Container */}
      <div className="space-y-4">
        {results.length === 0 && query.length >= 2 && !loading && (
          <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-400 font-medium">✕</div>
            <h3 className="text-sm font-semibold text-slate-700">No matches discovered</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">We couldn't find anything matching "{query}". Double-check your spelling or filters.</p>
          </div>
        )}

        {['vacancy', 'candidate', 'application'].map((group) => {
          const items = results.filter((r) => r.type === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="bg-white border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
              {/* Header Block */}
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  {group}s
                </span>
                <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {items.length} Found
                </span>
              </div>

              {/* List Entities */}
              <div className="divide-y divide-slate-50">
                {items.map((item, idx) => {
                  const globalIdx = results.indexOf(item);
                  const Ico = Icon(item.type);
                  const isActive = globalIdx === selected;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className={`flex items-center justify-between p-4.5 cursor-pointer transition-all duration-200 relative group/item ${isActive
                          ? 'bg-gradient-to-r from-indigo-50/80 to-blue-50/30'
                          : 'hover:bg-slate-50/60'
                        }`}
                    >
                      {/* Selected State Neon Border Accent */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                      )}

                      <div className="flex gap-4 items-center">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-300 ${isActive
                            ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white border-transparent scale-105 shadow-indigo-100'
                            : 'bg-slate-50 text-slate-500 border-slate-100 group-hover/item:bg-white group-hover/item:text-indigo-600'
                          }`}>
                          <Ico className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-slate-800 transition-colors ${isActive ? 'text-indigo-950 font-bold' : ''}`}>
                            {highlight(item.title)}
                          </div>
                          <div className="text-xs font-medium text-slate-400 mt-0.5 tracking-normal">
                            {highlight(item.subtitle || '')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all duration-300 ${isActive
                            ? 'bg-white text-indigo-700 border-indigo-100 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-100/80'
                          }`}>
                          {item.status}
                        </span>
                        <ArrowRight className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-indigo-600 translate-x-1' : 'text-slate-300 group-hover/item:text-slate-400'
                          }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Shortcuts Footer */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-500">↑↓</span>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-500">Enter</span>
          <span>Open Record</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-500">Min 2 Chars</span>
          <span>Query Length</span>
        </div>
      </div>
    </div>

  );
}