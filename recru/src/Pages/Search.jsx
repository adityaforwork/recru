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
        setResults(Array.isArray(data)? data : []);
        setSelected(0);
      } catch {}
      setLoading(false);
    }, 250);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (item) => {
    if(item.type === 'vacancy') navigate(`/vacancies/${item.navId}`);
    if(item.type === 'candidate') navigate(`/candidates?highlight=${item.navId}`);
    if(item.type === 'application') navigate(`/applications?job=${item.navId}`);
  };

  // Keyboard navigation
  const onKeyDown = (e) => {
    if(e.key === 'ArrowDown') { e.preventDefault(); setSelected(s=>Math.min(s+1, results.length-1)); }
    if(e.key === 'ArrowUp') { e.preventDefault(); setSelected(s=>Math.max(s-1, 0)); }
    if(e.key === 'Enter' && results[selected]) handleSelect(results[selected]);
  };

  const highlight = (text) => {
    if(!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((p,i)=> p.toLowerCase()===query.toLowerCase()? <span key={i} className="bg-yellow-200 font-bold">{p}</span> : p);
  };

  const Icon = (type) => type==='vacancy'? Briefcase : type==='candidate'? Users : GitMerge;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Search</h1>
        <p className="text-sm text-gray-500">Search vacancies, candidates, pipeline - everything</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          autoFocus
          onKeyDown={onKeyDown}
          type="text"
          placeholder="Try 'SQL Developer', 'Aniket', 'Screening'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-200 bg-white rounded- pl-12 pr-4 py-3.5 text- shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching...</div>}
      </div>

      {/* Grouped Results */}
      <div className="bg-white border border-gray-200 rounded- overflow-hidden divide-y">
        {results.length === 0 && query.length >= 2 &&!loading && <div className="p-10 text-center text-sm text-gray-400">No results for "{query}"</div>}
        {['vacancy','candidate','application'].map(group => {
          const items = results.filter(r=>r.type===group);
          if(items.length===0) return null;
          return (
            <div key={group}>
              <div className="px-5 py-2 bg-gray-50 text- tracking-widest uppercase font-semibold text-gray-400">{group}s • {items.length}</div>
              {items.map((item, idx) => {
                const globalIdx = results.indexOf(item);
                const Ico = Icon(item.type);
                const isActive = globalIdx === selected;
                return (
                  <div key={`${item.type}-${item.id}`} onClick={()=>handleSelect(item)}
                    className={`flex items-center justify-between p-4 hover:bg-blue-50/70 cursor-pointer transition-colors ${isActive?'bg-blue-50 border-l-4 border-blue-600':''}`}>
                    <div className="flex gap-3 items-start">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}><Ico className="w-4 h-4"/></div>
                      <div>
                        <div className="font-medium text- text-gray-900">{highlight(item.title)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{highlight(item.subtitle || '')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><span className="text- px-2 py-1 rounded-full border bg-gray-50">{item.status}</span><ArrowRight className="w-4 h-4 text-gray-300"/></div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <p className="text- text-gray-400 text-center">Press ↑ ↓ to navigate • Enter to open • Minimum 2 characters</p>
    </div>
  );
}