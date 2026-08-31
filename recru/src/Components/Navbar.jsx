import React from "react";
import { Search, Bell, ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Brand Name */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          Usha Yarns
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-50 border border-gray-300 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
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
