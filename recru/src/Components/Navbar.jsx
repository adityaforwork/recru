import React from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Brand Name */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          ABC Company Ltd.
        </span>
      </div>


      {/* Right Side - Search Icon + Bell + Profile */}
      <div className="flex items-center gap-2">
        {/* SEARCH*/}
        <button
          onClick={() => navigate('/search')}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          title="Search (Ctrl+K)"
        >
          <Search className="h-5 w-5" />
        </button>

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm">
            A
          </div>
          <span className="text-sm font-medium text-gray-700">Aditya</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
}